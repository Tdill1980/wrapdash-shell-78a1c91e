-- Create vehicle_models table
create table vehicle_models (
    id uuid primary key default gen_random_uuid(),
    make text not null,
    model text not null,
    year text not null,
    body_type text,
    category text,
    angle_front text default 'front 3/4 view, 45-degree angle',
    angle_rear text default 'rear 3/4 view, 45-degree angle',
    angle_side text default 'side profile view, 90-degree angle',
    angle_front_close text default 'front close-up view, straight on',
    render_prompt text,
    is_oem boolean default false,
    is_active boolean default true,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table vehicle_models enable row level security;

-- Everyone can read active vehicles
create policy "Anyone can view active vehicles"
on vehicle_models
for select
using (is_active = true);

-- Authenticated users can insert vehicles
create policy "Authenticated users can insert vehicles"
on vehicle_models
for insert
with check (auth.uid() = created_by);

-- Users can update only their own non-OEM vehicles
create policy "Users can update own vehicles"
on vehicle_models
for update
using (
    created_by = auth.uid()
    and is_oem = false
);

-- Admins can update any vehicle
create policy "Admins can update any vehicle"
on vehicle_models
for update
using (has_role(auth.uid(), 'admin'));

-- Admins can delete vehicles
create policy "Admins can delete vehicles"
on vehicle_models
for delete
using (has_role(auth.uid(), 'admin'));

-- Seed OEM vehicle data
insert into vehicle_models (make, model, year, body_type, category, is_oem, render_prompt) values
('Tesla', 'Model 3', '2023', 'Sedan', 'sedan', true, 'Sleek electric sedan with smooth curves and minimal body lines. Emphasize clean panel transitions and glass roof.'),
('Tesla', 'Model Y', '2023', 'SUV', 'suv', true, 'Compact electric SUV with curved rear hatch. Focus on side panel flow and rear quarter panel curves.'),
('BMW', 'M3', '2023', 'Sedan', 'sedan', true, 'Performance sedan with aggressive front kidney grille. Show sharp body lines and sculpted hood.'),
('BMW', 'M4', '2023', 'Coupe', 'coupe', true, 'Performance coupe with low roofline. Emphasize aggressive stance and wide fenders.'),
('Chevrolet', 'Corvette C8', '2023', 'Sports Car', 'exotic', true, 'Mid-engine supercar with dramatic body sculpting. Show angular panels and large air intakes.'),
('Porsche', '911 Turbo', '2023', 'Sports Car', 'exotic', true, 'Iconic sports car with smooth curves. Focus on fender arches and rear engine deck.'),
('Ford', 'F150', '2023', 'Truck', 'truck', true, 'Full-size pickup truck with large flat panels. Show bed sides, tailgate, and cab panels clearly.'),
('RAM', '1500', '2023', 'Truck', 'truck', true, 'Heavy-duty pickup with bold grille and muscular fenders. Emphasize door panels and bed.'),
('Chevrolet', 'Silverado 1500', '2023', 'Truck', 'truck', true, 'Full-size work truck with clean body lines. Show large door panels and bed sides.'),
('Toyota', 'Tundra', '2023', 'Truck', 'truck', true, 'Rugged pickup truck with aggressive stance. Focus on bed panels and side fenders.'),
('Toyota', 'Tacoma', '2023', 'Truck', 'truck', true, 'Mid-size pickup with compact proportions. Show accessible panel areas and bed.'),
('Mercedes-Benz', 'Sprinter 144', '2023', 'Van', 'van', true, 'Cargo van with large flat side panels. Perfect canvas for full wraps, show maximum panel area.'),
('Mercedes-Benz', 'Sprinter 170', '2023', 'Van', 'van', true, 'Extended cargo van with extra-long side panels. Show continuous panel flow from front to rear.'),
('Ford', 'Transit', '2023', 'Van', 'van', true, 'Full-size cargo van with tall body. Emphasize large side panel area and rear doors.'),
('Ford', 'Transit Connect', '2023', 'Van', 'van', true, 'Compact cargo van with accessible panels. Show side sliding door area and rear hatch.'),
('RAM', 'ProMaster', '2023', 'Van', 'van', true, 'Commercial van with flat sides. Perfect for wrap application, show clean panel areas.'),
('Honda', 'Civic', '2023', 'Sedan', 'sedan', true, 'Compact sedan with sporty lines. Show door panels and trunk area clearly.'),
('Honda', 'Accord', '2023', 'Sedan', 'sedan', true, 'Mid-size sedan with elegant proportions. Focus on side panels and hood area.'),
('Toyota', 'Camry', '2023', 'Sedan', 'sedan', true, 'Popular sedan with smooth body lines. Show accessible panel areas and trunk.'),
('Subaru', 'WRX', '2023', 'Sedan', 'sedan', true, 'Performance sedan with aggressive fender flares. Emphasize wide body panels and hood scoop.');