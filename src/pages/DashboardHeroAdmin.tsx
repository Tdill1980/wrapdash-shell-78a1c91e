import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardHeroImages } from '@/hooks/useDashboardHeroImages';
import { useAdmin } from '@/hooks/useAdmin';
import { Upload, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardHeroAdmin() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { images, loading, uploadImage, deleteImage, updateImage } = useDashboardHeroImages();
  const navigate = useNavigate();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'night' | 'all'>('all');
  const [displayOrder, setDisplayOrder] = useState('0');

  if (adminLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadImage(selectedFile, {
      title,
      subtitle,
      time_of_day: timeOfDay,
      display_order: parseInt(displayOrder),
    });

    // Reset form
    setSelectedFile(null);
    setTitle('');
    setSubtitle('');
    setTimeOfDay('all');
    setDisplayOrder('0');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Hero Manager</h1>
        <p className="text-muted-foreground mt-2">Upload and manage hero images for the dashboard</p>
      </div>

      {/* Upload Section */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle>Upload New Hero Image</CardTitle>
          <CardDescription>Add a new hero image with optional time-based display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image">Image File</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="WrapCentral"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subtitle">Subtitle (Optional)</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Your Command Center for Wrap Operations"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="timeOfDay">Time of Day</Label>
            <Select value={timeOfDay} onValueChange={(value: any) => setTimeOfDay(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Day</SelectItem>
                <SelectItem value="morning">Morning (5am - 12pm)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12pm - 6pm)</SelectItem>
                <SelectItem value="night">Night (6pm - 5am)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <Button onClick={handleUpload} disabled={!selectedFile} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Upload Hero Image
          </Button>
        </CardContent>
      </Card>

      {/* Current Images */}
      <Card className="card-dark">
        <CardHeader>
          <CardTitle>Current Hero Images</CardTitle>
          <CardDescription>
            {images.length > 1 
              ? 'Multiple images will display as a carousel' 
              : images.length === 1 
              ? 'Single image will display statically'
              : 'No images uploaded yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading images...</p>
          ) : images.length === 0 ? (
            <p className="text-muted-foreground">No hero images found. Upload one to get started!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={image.image_url}
                      alt={image.title || 'Hero image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div>
                      <p className="font-semibold">{image.title || 'Untitled'}</p>
                      <p className="text-sm text-muted-foreground">{image.subtitle || 'No subtitle'}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Time: {image.time_of_day === 'all' ? 'All Day' : image.time_of_day}
                      </span>
                      <span className="text-muted-foreground">
                        Order: {image.display_order}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteImage(image.id, image.image_url)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
