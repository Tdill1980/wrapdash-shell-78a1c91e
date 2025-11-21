import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { generateMasterCanvas, generate3DRender, convertToPrint } from './api';
import { VehicleSelector } from './components/VehicleSelector';
import { saveDesignPanel } from './panel-api';
import { PanelLibrary } from './components/PanelLibrary';
import { PanelSelector } from './components/PanelSelector';

export default function DesignPanelProEnterprise() {
  const [showLibrary, setShowLibrary] = useState(false);
  const [width, setWidth] = useState('60');
  const [height, setHeight] = useState('30');
  const [vehicleModelId, setVehicleModelId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [style, setStyle] = useState('commercial');
  const [subStyle, setSubStyle] = useState('clean');
  const [intensity, setIntensity] = useState('medium');
  
  // 3D Rendering Options
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'side' | 'rear' | 'front-close'>('front');
  const [selectedFinish, setSelectedFinish] = useState<'gloss' | 'satin' | 'matte'>('gloss');
  const [selectedEnvironment, setSelectedEnvironment] = useState<'studio' | 'white' | 'desert' | 'city' | 'garage' | 'showroom'>('studio');
  
  // Panel Selection (auto-select all panels by default)
  const [availablePanels, setAvailablePanels] = useState<any[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAllAngles, setGeneratingAllAngles] = useState(false);
  
  const [preview, setPreview] = useState<string | null>(null);
  const [renders, setRenders] = useState<Record<string, string>>({});
  const [tiffUrl, setTiffUrl] = useState<string | null>(null);
  const [printMetadata, setPrintMetadata] = useState<any>(null);

  // Auto-select all panels when vehicle changes
  React.useEffect(() => {
    if (selectedVehicle?.panel_geometry?.panels) {
      const panels = selectedVehicle.panel_geometry.panels;
      setAvailablePanels(panels);
      setSelectedPanels(panels.map((p: any) => p.name));
    } else {
      setAvailablePanels([]);
      setSelectedPanels([]);
    }
  }, [selectedVehicle]);

  const handleGenerate = async () => {
    if (!vehicleModelId) {
      toast.error('Please select a vehicle first');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Generate flat panel
      toast.info('Generating flat panel design...');
      const masterData = await generateMasterCanvas({
        width,
        height,
        style,
        subStyle,
        intensity
      });
      setPreview(masterData.preview);
      
      // Step 2: Generate 3D render with selected vehicle, angle, finish, environment, and panels
      toast.info(`Creating 3D render (${selectedAngle}, ${selectedFinish})...`);
      const renderData = await generate3DRender({
        panelUrl: masterData.preview,
        vehicleModelId,
        angle: selectedAngle,
        finish: selectedFinish,
        environment: selectedEnvironment,
        selectedPanels
      });
      setRenders(prev => ({ ...prev, [selectedAngle]: renderData.render }));
      
      // Step 3: Convert to print-ready
      toast.info('Converting to print-ready format...');
      const printData = await convertToPrint({
        panelUrl: masterData.preview,
        width,
        height
      });
      setTiffUrl(printData.tiffUrl);
      setPrintMetadata(printData.metadata);
      
      toast.success('Panel design complete!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate design');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllAngles = async () => {
    if (!vehicleModelId || !preview) {
      toast.error('Generate a panel design first');
      return;
    }

    setGeneratingAllAngles(true);
    const angles: Array<'front' | 'side' | 'rear' | 'front-close'> = ['front', 'side', 'rear', 'front-close'];
    
    try {
      toast.info('Generating all camera angles...');
      
      for (const angle of angles) {
        toast.info(`Generating ${angle} view...`);
        const renderData = await generate3DRender({
          panelUrl: preview,
          vehicleModelId,
          angle,
          finish: selectedFinish,
          environment: selectedEnvironment,
          selectedPanels
        });
        setRenders(prev => ({ ...prev, [angle]: renderData.render }));
      }
      
      toast.success('All angles generated successfully!');
    } catch (error) {
      console.error('Error generating all angles:', error);
      toast.error('Failed to generate all angles');
    } finally {
      setGeneratingAllAngles(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!preview) {
      toast.error('Generate a panel design first');
      return;
    }

    setSaving(true);
    try {
      const primaryRender = renders[selectedAngle] || renders.front || Object.values(renders)[0];
      
      await saveDesignPanel({
        vehicle_id: vehicleModelId || undefined,
        vehicle_make: selectedVehicle?.make,
        vehicle_model: selectedVehicle?.model,
        vehicle_year: selectedVehicle?.year,
        style,
        substyle: subStyle,
        intensity,
        width_inches: Number(width),
        height_inches: Number(height),
        panel_preview_url: preview,
        panel_3d_url: primaryRender || undefined,
        tiff_url: tiffUrl || undefined,
        metadata: {
          ...printMetadata,
          renders,
          finish: selectedFinish,
          environment: selectedEnvironment
        }
      });
      
      toast.success('Design saved to library!');
    } catch (error) {
      console.error('Error saving panel:', error);
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  if (showLibrary) {
    return <PanelLibrary />;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] p-8">
      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-[320px] flex-shrink-0">
          <Card className="rounded-2xl bg-[#141415] border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                DesignPanelPro Enterprise™
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Library Button */}
              <Button
                onClick={() => setShowLibrary(true)}
                variant="outline"
                className="w-full"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Design Library
              </Button>

              {/* Vehicle Selector - FIRST */}
              <VehicleSelector 
                onSelect={(vehicle) => {
                  setVehicleModelId(vehicle?.id || null);
                  setSelectedVehicle(vehicle);
                }} 
              />

              {/* Width */}
              <div>
                <Label htmlFor="width">Width (inches)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Height */}
              <div>
                <Label htmlFor="height">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="style">Category</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="restyle">Restyle</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                    <SelectItem value="livery">Livery</SelectItem>
                    <SelectItem value="racing">Racing</SelectItem>
                    <SelectItem value="offroad">Offroad</SelectItem>
                    <SelectItem value="highend">High-End</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sub-Style (only for commercial) */}
              {style === 'commercial' && (
                <div>
                  <Label htmlFor="subStyle">Sub-Style</Label>
                  <Select value={subStyle} onValueChange={setSubStyle}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Clean</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="patterned">Patterned</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Intensity */}
              <div>
                <Label>Intensity</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={intensity === 'soft' ? 'default' : 'outline'}
                    onClick={() => setIntensity('soft')}
                    className={intensity === 'soft' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90' : ''}
                  >
                    Soft
                  </Button>
                  <Button
                    variant={intensity === 'medium' ? 'default' : 'outline'}
                    onClick={() => setIntensity('medium')}
                    className={intensity === 'medium' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90' : ''}
                  >
                    Medium
                  </Button>
                  <Button
                    variant={intensity === 'extreme' ? 'default' : 'outline'}
                    onClick={() => setIntensity('extreme')}
                    className={intensity === 'extreme' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90' : ''}
                  >
                    Extreme
                  </Button>
                </div>
              </div>

              {/* Panel Selection (shown after vehicle selection) */}
              {vehicleModelId && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold text-[#22d3ee]">Panel Selection</h3>
                  <PanelSelector
                    panels={availablePanels}
                    selectedPanels={selectedPanels}
                    onPanelToggle={(panelName) => {
                      setSelectedPanels(prev =>
                        prev.includes(panelName)
                          ? prev.filter(p => p !== panelName)
                          : [...prev, panelName]
                      );
                    }}
                    onSelectAll={() => setSelectedPanels(availablePanels.map(p => p.name))}
                    onDeselectAll={() => setSelectedPanels([])}
                  />
                </div>
              )}

              {/* 3D Rendering Options */}
              {preview && vehicleModelId && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold text-[#22d3ee]">3D Rendering Options</h3>
                  
                  {/* Camera Angle */}
                  <div>
                    <Label>Camera Angle</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        variant={selectedAngle === 'front' ? 'default' : 'outline'}
                        onClick={() => setSelectedAngle('front')}
                        className={selectedAngle === 'front' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black' : ''}
                        size="sm"
                      >
                        Front 3/4
                      </Button>
                      <Button
                        variant={selectedAngle === 'side' ? 'default' : 'outline'}
                        onClick={() => setSelectedAngle('side')}
                        className={selectedAngle === 'side' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black' : ''}
                        size="sm"
                      >
                        Side
                      </Button>
                      <Button
                        variant={selectedAngle === 'rear' ? 'default' : 'outline'}
                        onClick={() => setSelectedAngle('rear')}
                        className={selectedAngle === 'rear' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black' : ''}
                        size="sm"
                      >
                        Rear 3/4
                      </Button>
                      <Button
                        variant={selectedAngle === 'front-close' ? 'default' : 'outline'}
                        onClick={() => setSelectedAngle('front-close')}
                        className={selectedAngle === 'front-close' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black' : ''}
                        size="sm"
                      >
                        Front Close
                      </Button>
                    </div>
                  </div>

                  {/* Finish Type */}
                  <div>
                    <Label>Wrap Finish</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button
                        variant={selectedFinish === 'gloss' ? 'default' : 'outline'}
                        onClick={() => setSelectedFinish('gloss')}
                        className={selectedFinish === 'gloss' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black' : ''}
                        size="sm"
                      >
                        Gloss
                      </Button>
                      <Button
                        variant={selectedFinish === 'satin' ? 'default' : 'outline'}
                        onClick={() => setSelectedFinish('satin')}
                        className={selectedFinish === 'satin' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black' : ''}
                        size="sm"
                      >
                        Satin
                      </Button>
                      <Button
                        variant={selectedFinish === 'matte' ? 'default' : 'outline'}
                        onClick={() => setSelectedFinish('matte')}
                        className={selectedFinish === 'matte' ? 'bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black' : ''}
                        size="sm"
                      >
                        Matte
                      </Button>
                    </div>
                  </div>

                  {/* Environment */}
                  <div>
                    <Label>Environment</Label>
                    <Select value={selectedEnvironment} onValueChange={(v: any) => setSelectedEnvironment(v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Dark Studio</SelectItem>
                        <SelectItem value="white">White Cyclorama</SelectItem>
                        <SelectItem value="desert">Desert Landscape</SelectItem>
                        <SelectItem value="city">Night City</SelectItem>
                        <SelectItem value="garage">Industrial Garage</SelectItem>
                        <SelectItem value="showroom">Luxury Showroom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Generate All Angles Button */}
                  <Button
                    onClick={handleGenerateAllAngles}
                    disabled={generatingAllAngles}
                    variant="outline"
                    className="w-full"
                  >
                    {generatingAllAngles ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating All Angles...
                      </>
                    ) : (
                      'Generate All Camera Angles'
                    )}
                  </Button>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full h-12 bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Panel Design'
                )}
              </Button>

              {/* Save to Library Button */}
              {preview && (
                <Button
                  onClick={handleSaveToLibrary}
                  disabled={saving}
                  variant="outline"
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Library
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 space-y-6">
          {/* Flat Panel Design */}
          <Card className="rounded-2xl bg-[#141415] border-border">
            <CardHeader>
              <CardTitle>Flat Panel Design</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[550px] flex items-center justify-center bg-black/20 rounded-lg">
                {preview ? (
                  <img
                    src={preview}
                    alt="Flat Panel Design"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-muted-foreground">Panel design will appear here</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3D Vehicle Renders */}
          <Card className="rounded-2xl bg-[#141415] border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>3D Vehicle Render</span>
                {Object.keys(renders).length > 0 && (
                  <span className="text-sm text-[#22d3ee]">
                    {Object.keys(renders).length} angle{Object.keys(renders).length !== 1 ? 's' : ''} generated
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Render Display */}
              <div className="h-[450px] flex items-center justify-center bg-black/20 rounded-lg">
                {renders[selectedAngle] ? (
                  <img
                    src={renders[selectedAngle]}
                    alt={`3D Vehicle Render - ${selectedAngle}`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-muted-foreground">
                    {Object.keys(renders).length > 0 
                      ? `No ${selectedAngle} render yet. Select a different angle or generate it.`
                      : '3D render will appear here'}
                  </p>
                )}
              </div>

              {/* Angle Thumbnails */}
              {Object.keys(renders).length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {(['front', 'side', 'rear', 'front-close'] as const).map(angle => (
                    renders[angle] && (
                      <button
                        key={angle}
                        onClick={() => setSelectedAngle(angle)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          selectedAngle === angle 
                            ? 'border-[#22d3ee] ring-2 ring-[#22d3ee]/50' 
                            : 'border-border hover:border-[#22d3ee]/50'
                        }`}
                      >
                        <img
                          src={renders[angle]}
                          alt={`${angle} view`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                          <p className="text-xs text-white capitalize">
                            {angle.replace('-', ' ')}
                          </p>
                        </div>
                      </button>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Print-Ready Files */}
          <Card className="rounded-2xl bg-[#141415] border-border">
            <CardHeader>
              <CardTitle>Print-Ready Files</CardTitle>
            </CardHeader>
            <CardContent>
              {tiffUrl ? (
                <Button
                  asChild
                  className="bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black font-bold"
                >
                  <a href={tiffUrl} download target="_blank" rel="noopener noreferrer">
                    Download Print-Ready TIFF (300 DPI)
                  </a>
                </Button>
              ) : (
                <p className="text-muted-foreground">
                  Print-ready file will be available after generation
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
