import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PanelCard } from './PanelCard';
import { PanelDetailModal } from './PanelDetailModal';
import { fetchDesignPanels, deleteDesignPanel, DesignPanel } from '../panel-api';
import { toast } from 'sonner';
import { Search, FolderPlus, Filter } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function PanelLibrary() {
  const [panels, setPanels] = useState<DesignPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  const [selectedPanel, setSelectedPanel] = useState<DesignPanel | null>(null);

  const loadPanels = async () => {
    try {
      setLoading(true);
      const filters = styleFilter !== 'all' ? { style: styleFilter } : undefined;
      const data = await fetchDesignPanels(filters);
      setPanels(data);
    } catch (error) {
      console.error('Error loading panels:', error);
      toast.error('Failed to load design panels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPanels();
  }, [styleFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this panel?')) return;
    
    try {
      await deleteDesignPanel(id);
      toast.success('Panel deleted successfully');
      loadPanels();
    } catch (error) {
      console.error('Error deleting panel:', error);
      toast.error('Failed to delete panel');
    }
  };

  const handleDuplicate = (panel: DesignPanel) => {
    // TODO: Implement duplication logic
    toast.info('Duplicate feature coming soon');
  };

  const filteredPanels = panels.filter(panel => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      panel.vehicle_make?.toLowerCase().includes(query) ||
      panel.vehicle_model?.toLowerCase().includes(query) ||
      panel.style.toLowerCase().includes(query) ||
      panel.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-[#0B0B0C] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Design <span className="text-[#22d3ee]">Library</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and organize your panel designs
            </p>
          </div>
          
          <Button className="bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>

        <Card className="rounded-2xl bg-[#141415] border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle, style, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={styleFilter} onValueChange={setStyleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="restyle">Restyle</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="livery">Livery</SelectItem>
                  <SelectItem value="racing">Racing</SelectItem>
                  <SelectItem value="offroad">Offroad</SelectItem>
                  <SelectItem value="highend">High-End</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                {filteredPanels.length} design{filteredPanels.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#22d3ee]" />
          </div>
        ) : filteredPanels.length === 0 ? (
          <Card className="rounded-2xl bg-[#141415] border-border">
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground text-lg">
                No design panels found. Create your first panel to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPanels.map(panel => (
              <PanelCard
                key={panel.id}
                panel={panel}
                onView={setSelectedPanel}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {selectedPanel && (
        <PanelDetailModal
          panel={selectedPanel}
          onClose={() => setSelectedPanel(null)}
          onUpdate={loadPanels}
        />
      )}
    </div>
  );
}
