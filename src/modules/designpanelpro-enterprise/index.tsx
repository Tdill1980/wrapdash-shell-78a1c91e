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

export default function DesignPanelProEnterprise() {
  const [showLibrary, setShowLibrary] = useState(false);
  const [width, setWidth] = useState('60');
  const [height, setHeight] = useState('30');
  const [vehicleModelId, setVehicleModelId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [style, setStyle] = useState('commercial');
  const [subStyle, setSubStyle] = useState('clean');
  const [intensity, setIntensity] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [preview, setPreview] = useState<string | null>(null);
  const [render, setRender] = useState<string | null>(null);
  const [tiffUrl, setTiffUrl] = useState<string | null>(null);
  const [printMetadata, setPrintMetadata] = useState<any>(null);

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
      
      // Step 2: Generate 3D render with selected vehicle
      toast.info('Creating 3D vehicle render...');
      const renderData = await generate3DRender({
        panelUrl: masterData.preview,
        vehicleModelId
      });
      setRender(renderData.render);
      
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

  const handleSaveToLibrary = async () => {
    if (!preview) {
      toast.error('Generate a panel design first');
      return;
    }

    setSaving(true);
    try {
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
        panel_3d_url: render || undefined,
        tiff_url: tiffUrl || undefined,
        metadata: printMetadata
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

          {/* 3D Vehicle Render */}
          <Card className="rounded-2xl bg-[#141415] border-border">
            <CardHeader>
              <CardTitle>3D Vehicle Render</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[450px] flex items-center justify-center bg-black/20 rounded-lg">
                {render ? (
                  <img
                    src={render}
                    alt="3D Vehicle Render"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-muted-foreground">3D render will appear here</p>
                )}
              </div>
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
