/**
 * ClubWPW Admin - Manage Monthly Drops + Wrap of the Week
 * 
 * Admin features:
 * - Upload/manage monthly design drops
 * - Add/manage WOTW nominees
 * - Select weekly winners
 * - Select monthly champions
 */

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, Trash2, Crown, Trophy, Upload, Eye, 
  Calendar, Instagram, Save, Loader2, Image,
  CheckCircle2, XCircle, Edit, Star, Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MainLayout } from "@/layouts/MainLayout";

interface VaultDrop {
  id: string;
  design_name: string;
  design_description: string;
  preview_image_url: string;
  hero_render_url: string;
  files: Record<string, string>;
  panel_type: string;
  featured_month: string;
  starts_at: string;
  expires_at: string;
  status: string;
  is_exclusive: boolean;
  download_count: number;
  tags: string[];
}

interface WOTWNominee {
  id: string;
  wrap_title: string;
  wrap_description: string;
  artist_name: string;
  artist_instagram: string;
  hero_image_url: string;
  image_urls: string[];
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  week_of: string;
  status: string;
  is_finalist: boolean;
  is_winner: boolean;
  vote_count: number;
}

export default function ClubWPWAdmin() {
  const [activeTab, setActiveTab] = useState("drops");
  const [drops, setDrops] = useState<VaultDrop[]>([]);
  const [nominees, setNominees] = useState<WOTWNominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Drop form state
  const [dropForm, setDropForm] = useState({
    design_name: '',
    design_description: '',
    preview_image_url: '',
    hero_render_url: '',
    panel_type: 'full_panel',
    featured_month: new Date().toISOString().slice(0, 7),
    expires_at: '',
    is_exclusive: true,
    tags: '',
    files: { small: '', medium: '', large: '', xl: '' }
  });
  
  // Nominee form state
  const [nomineeForm, setNomineeForm] = useState({
    artist_name: '',
    artist_instagram: '',
    hero_image_url: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    week_of: '',
    wrap_title: '',
    wrap_description: ''
  });

  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [nomineeModalOpen, setNomineeModalOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<VaultDrop | null>(null);
  const [editingNominee, setEditingNominee] = useState<WOTWNominee | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch drops
    const { data: dropsData } = await supabase
      .from('clubwpw_vault_drops')
      .select('*')
      .order('featured_month', { ascending: false });
    
    if (dropsData) setDrops(dropsData);

    // Fetch nominees
    const { data: nomineesData } = await supabase
      .from('wotw_nominees')
      .select('*')
      .order('week_of', { ascending: false });
    
    if (nomineesData) setNominees(nomineesData);

    setLoading(false);
  };

  const saveDrop = async () => {
    setSaving(true);
    
    const dropData = {
      design_name: dropForm.design_name,
      design_description: dropForm.design_description,
      preview_image_url: dropForm.preview_image_url,
      hero_render_url: dropForm.hero_render_url || dropForm.preview_image_url,
      panel_type: dropForm.panel_type,
      featured_month: dropForm.featured_month,
      expires_at: dropForm.expires_at || null,
      is_exclusive: dropForm.is_exclusive,
      tags: dropForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      files: dropForm.files,
      status: 'active'
    };

    let error;
    if (editingDrop) {
      const result = await supabase
        .from('clubwpw_vault_drops')
        .update(dropData)
        .eq('id', editingDrop.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('clubwpw_vault_drops')
        .insert(dropData);
      error = result.error;
    }

    if (error) {
      toast({ title: "Error saving drop", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingDrop ? "Drop updated!" : "Drop created!" });
      setDropModalOpen(false);
      resetDropForm();
      fetchData();
    }
    
    setSaving(false);
  };

  const saveNominee = async () => {
    setSaving(true);
    
    const nomineeData = {
      artist_name: nomineeForm.artist_name,
      artist_instagram: nomineeForm.artist_instagram.replace('@', ''),
      hero_image_url: nomineeForm.hero_image_url,
      image_urls: [nomineeForm.hero_image_url],
      vehicle_make: nomineeForm.vehicle_make,
      vehicle_model: nomineeForm.vehicle_model,
      vehicle_year: nomineeForm.vehicle_year,
      week_of: nomineeForm.week_of,
      wrap_title: nomineeForm.wrap_title,
      wrap_description: nomineeForm.wrap_description,
      is_finalist: true,
      status: 'nominated'
    };

    let error;
    if (editingNominee) {
      const result = await supabase
        .from('wotw_nominees')
        .update(nomineeData)
        .eq('id', editingNominee.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('wotw_nominees')
        .insert(nomineeData);
      error = result.error;
    }

    if (error) {
      toast({ title: "Error saving nominee", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingNominee ? "Nominee updated!" : "Nominee added!" });
      setNomineeModalOpen(false);
      resetNomineeForm();
      fetchData();
    }
    
    setSaving(false);
  };

  const deleteDrop = async (id: string) => {
    if (!confirm("Delete this drop?")) return;
    
    const { error } = await supabase
      .from('clubwpw_vault_drops')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error deleting", variant: "destructive" });
    } else {
      toast({ title: "Drop deleted" });
      fetchData();
    }
  };

  const deleteNominee = async (id: string) => {
    if (!confirm("Delete this nominee?")) return;
    
    const { error } = await supabase
      .from('wotw_nominees')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: "Error deleting", variant: "destructive" });
    } else {
      toast({ title: "Nominee deleted" });
      fetchData();
    }
  };

  const toggleWinner = async (nominee: WOTWNominee) => {
    const { error } = await supabase
      .from('wotw_nominees')
      .update({ is_winner: !nominee.is_winner, status: !nominee.is_winner ? 'winner' : 'nominated' })
      .eq('id', nominee.id);
    
    if (!error) {
      toast({ title: nominee.is_winner ? "Winner status removed" : "Marked as winner! 🏆" });
      fetchData();
    }
  };

  const toggleFinalist = async (nominee: WOTWNominee) => {
    const { error } = await supabase
      .from('wotw_nominees')
      .update({ is_finalist: !nominee.is_finalist })
      .eq('id', nominee.id);
    
    if (!error) {
      toast({ title: nominee.is_finalist ? "Removed from finalists" : "Added to finalists!" });
      fetchData();
    }
  };

  const resetDropForm = () => {
    setDropForm({
      design_name: '',
      design_description: '',
      preview_image_url: '',
      hero_render_url: '',
      panel_type: 'full_panel',
      featured_month: new Date().toISOString().slice(0, 7),
      expires_at: '',
      is_exclusive: true,
      tags: '',
      files: { small: '', medium: '', large: '', xl: '' }
    });
    setEditingDrop(null);
  };

  const resetNomineeForm = () => {
    setNomineeForm({
      artist_name: '',
      artist_instagram: '',
      hero_image_url: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_year: '',
      week_of: '',
      wrap_title: '',
      wrap_description: ''
    });
    setEditingNominee(null);
  };

  const editDrop = (drop: VaultDrop) => {
    setDropForm({
      design_name: drop.design_name,
      design_description: drop.design_description || '',
      preview_image_url: drop.preview_image_url,
      hero_render_url: drop.hero_render_url || '',
      panel_type: drop.panel_type,
      featured_month: drop.featured_month,
      expires_at: drop.expires_at || '',
      is_exclusive: drop.is_exclusive,
      tags: drop.tags?.join(', ') || '',
      files: drop.files as any || { small: '', medium: '', large: '', xl: '' }
    });
    setEditingDrop(drop);
    setDropModalOpen(true);
  };

  const editNominee = (nominee: WOTWNominee) => {
    setNomineeForm({
      artist_name: nominee.artist_name,
      artist_instagram: nominee.artist_instagram,
      hero_image_url: nominee.hero_image_url || '',
      vehicle_make: nominee.vehicle_make || '',
      vehicle_model: nominee.vehicle_model || '',
      vehicle_year: nominee.vehicle_year || '',
      week_of: nominee.week_of,
      wrap_title: nominee.wrap_title || '',
      wrap_description: nominee.wrap_description || ''
    });
    setEditingNominee(nominee);
    setNomineeModalOpen(true);
  };

  // Calculate current week
  const getCurrentWeek = () => {
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
    return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  };

  return (
    <MainLayout>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              ClubWPW Admin
            </h1>
            <p className="text-white/50 text-sm">Manage monthly drops & Wrap of the Week</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black border border-fuchsia-500/20">
            <TabsTrigger value="drops" className="data-[state=active]:bg-fuchsia-500/20">
              <Star className="w-4 h-4 mr-2" />
              Monthly Drops
            </TabsTrigger>
            <TabsTrigger value="nominees" className="data-[state=active]:bg-fuchsia-500/20">
              <Award className="w-4 h-4 mr-2" />
              WOTW Nominees
            </TabsTrigger>
          </TabsList>

          {/* Monthly Drops Tab */}
          <TabsContent value="drops" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Monthly Design Drops</h2>
              <Button 
                onClick={() => { resetDropForm(); setDropModalOpen(true); }}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Drop
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" />
              </div>
            ) : drops.length > 0 ? (
              <div className="grid gap-4">
                {drops.map(drop => (
                  <Card key={drop.id} className="bg-black border border-white/10 p-4">
                    <div className="flex gap-4">
                      {/* Preview */}
                      <div className="w-32 h-24 rounded-lg overflow-hidden bg-[#1a1a24] flex-shrink-0">
                        {drop.preview_image_url ? (
                          <img src={drop.preview_image_url} alt={drop.design_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-8 h-8 text-white/20" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-semibold">{drop.design_name}</h3>
                            <p className="text-white/50 text-sm">{drop.design_description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={drop.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                              {drop.status}
                            </Badge>
                            {drop.is_exclusive && (
                              <Badge className="bg-fuchsia-500/20 text-fuchsia-400">Exclusive</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-4 mt-2 text-xs text-white/50">
                          <span>📅 {drop.featured_month}</span>
                          <span>📥 {drop.download_count || 0} downloads</span>
                          <span>🏷️ {drop.panel_type}</span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="border-white/10 text-white" onClick={() => editDrop(drop)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => deleteDrop(drop.id)}>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/50 border border-white/10 p-12 text-center">
                <Star className="w-12 h-12 text-fuchsia-400/30 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No drops yet</h3>
                <p className="text-white/50 text-sm mb-4">Create your first monthly design drop</p>
                <Button onClick={() => setDropModalOpen(true)} className="bg-gradient-to-r from-fuchsia-500 to-purple-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Drop
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* WOTW Nominees Tab */}
          <TabsContent value="nominees" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Wrap of the Week Nominees</h2>
              <Button 
                onClick={() => { 
                  resetNomineeForm(); 
                  setNomineeForm(prev => ({ ...prev, week_of: getCurrentWeek() }));
                  setNomineeModalOpen(true); 
                }}
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Nominee
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" />
              </div>
            ) : nominees.length > 0 ? (
              <div className="grid gap-4">
                {nominees.map(nominee => (
                  <Card key={nominee.id} className={`bg-black border p-4 ${nominee.is_winner ? 'border-amber-400' : 'border-white/10'}`}>
                    <div className="flex gap-4">
                      {/* Preview */}
                      <div className="w-32 h-24 rounded-lg overflow-hidden bg-[#1a1a24] flex-shrink-0 relative">
                        {nominee.hero_image_url ? (
                          <img src={nominee.hero_image_url} alt={nominee.artist_instagram} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-8 h-8 text-white/20" />
                          </div>
                        )}
                        {nominee.is_winner && (
                          <div className="absolute top-1 right-1">
                            <Crown className="w-5 h-5 text-amber-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-fuchsia-400 font-semibold flex items-center gap-2">
                              <Instagram className="w-4 h-4" />
                              @{nominee.artist_instagram}
                            </h3>
                            <p className="text-white/50 text-sm">
                              {nominee.vehicle_year} {nominee.vehicle_make} {nominee.vehicle_model}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {nominee.is_winner && (
                              <Badge className="bg-amber-500/20 text-amber-400">🏆 Winner</Badge>
                            )}
                            {nominee.is_finalist && !nominee.is_winner && (
                              <Badge className="bg-fuchsia-500/20 text-fuchsia-400">Finalist</Badge>
                            )}
                            <Badge className="bg-white/10 text-white/50">{nominee.week_of}</Badge>
                          </div>
                        </div>

                        <div className="flex gap-4 mt-2 text-xs text-white/50">
                          <span>🗳️ {nominee.vote_count || 0} votes</span>
                          <span>📋 {nominee.status}</span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant={nominee.is_winner ? "default" : "outline"}
                            className={nominee.is_winner ? "bg-amber-500 hover:bg-amber-600" : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"}
                            onClick={() => toggleWinner(nominee)}
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            {nominee.is_winner ? 'Winner ✓' : 'Make Winner'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className={nominee.is_finalist ? "border-green-500/30 text-green-400" : "border-white/10 text-white/50"}
                            onClick={() => toggleFinalist(nominee)}
                          >
                            {nominee.is_finalist ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            Finalist
                          </Button>
                          <Button size="sm" variant="outline" className="border-white/10 text-white" onClick={() => editNominee(nominee)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => deleteNominee(nominee.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-black/50 border border-white/10 p-12 text-center">
                <Award className="w-12 h-12 text-fuchsia-400/30 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No nominees yet</h3>
                <p className="text-white/50 text-sm mb-4">Add your first Wrap of the Week nominee</p>
                <Button onClick={() => setNomineeModalOpen(true)} className="bg-gradient-to-r from-fuchsia-500 to-purple-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Nominee
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Drop Modal */}
        <Dialog open={dropModalOpen} onOpenChange={setDropModalOpen}>
          <DialogContent className="bg-[#0a0a0f] border border-fuchsia-500/30 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingDrop ? 'Edit Drop' : 'New Monthly Drop'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-white/70">Design Name *</Label>
                <Input
                  value={dropForm.design_name}
                  onChange={(e) => setDropForm({ ...dropForm, design_name: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="Dragon Blossom Fury"
                />
              </div>

              <div>
                <Label className="text-white/70">Description</Label>
                <Textarea
                  value={dropForm.design_description}
                  onChange={(e) => setDropForm({ ...dropForm, design_description: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="Japanese-inspired dragon design..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Featured Month *</Label>
                  <Input
                    type="month"
                    value={dropForm.featured_month}
                    onChange={(e) => setDropForm({ ...dropForm, featured_month: e.target.value })}
                    className="bg-black border-white/10 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Expires At</Label>
                  <Input
                    type="datetime-local"
                    value={dropForm.expires_at}
                    onChange={(e) => setDropForm({ ...dropForm, expires_at: e.target.value })}
                    className="bg-black border-white/10 text-white mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white/70">Preview Image URL *</Label>
                <Input
                  value={dropForm.preview_image_url}
                  onChange={(e) => setDropForm({ ...dropForm, preview_image_url: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label className="text-white/70">Hero Render URL</Label>
                <Input
                  value={dropForm.hero_render_url}
                  onChange={(e) => setDropForm({ ...dropForm, hero_render_url: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Panel Type</Label>
                  <Select value={dropForm.panel_type} onValueChange={(v) => setDropForm({ ...dropForm, panel_type: v })}>
                    <SelectTrigger className="bg-black border-white/10 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_panel">Full Panel</SelectItem>
                      <SelectItem value="2_sides">2 Sides</SelectItem>
                      <SelectItem value="hood">Hood Only</SelectItem>
                      <SelectItem value="roof">Roof Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={dropForm.is_exclusive}
                    onCheckedChange={(v) => setDropForm({ ...dropForm, is_exclusive: v })}
                  />
                  <Label className="text-white/70">Exclusive</Label>
                </div>
              </div>

              <div>
                <Label className="text-white/70">Tags (comma separated)</Label>
                <Input
                  value={dropForm.tags}
                  onChange={(e) => setDropForm({ ...dropForm, tags: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="japanese, dragon, colorful"
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <Label className="text-white/70 mb-2 block">Download Files (by size)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['small', 'medium', 'large', 'xl'].map(size => (
                    <div key={size}>
                      <Label className="text-white/50 text-xs uppercase">{size}</Label>
                      <Input
                        value={(dropForm.files as any)[size] || ''}
                        onChange={(e) => setDropForm({ 
                          ...dropForm, 
                          files: { ...dropForm.files, [size]: e.target.value }
                        })}
                        className="bg-black border-white/10 text-white text-xs"
                        placeholder="URL..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={saveDrop} 
                disabled={saving || !dropForm.design_name || !dropForm.preview_image_url}
                className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editingDrop ? 'Update Drop' : 'Create Drop'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Nominee Modal */}
        <Dialog open={nomineeModalOpen} onOpenChange={setNomineeModalOpen}>
          <DialogContent className="bg-[#0a0a0f] border border-fuchsia-500/30 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingNominee ? 'Edit Nominee' : 'Add WOTW Nominee'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70">Artist Name *</Label>
                  <Input
                    value={nomineeForm.artist_name}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, artist_name: e.target.value })}
                    className="bg-black border-white/10 text-white mt-1"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Instagram Handle *</Label>
                  <Input
                    value={nomineeForm.artist_instagram}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, artist_instagram: e.target.value })}
                    className="bg-black border-white/10 text-white mt-1"
                    placeholder="@wrapmaster"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white/70">Week *</Label>
                <Input
                  value={nomineeForm.week_of}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, week_of: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="2026-W06"
                />
              </div>

              <div>
                <Label className="text-white/70">Hero Image URL *</Label>
                <Input
                  value={nomineeForm.hero_image_url}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, hero_image_url: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white/70">Year</Label>
                  <Input
                    value={nomineeForm.vehicle_year}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, vehicle_year: e.target.value })}
                    className="bg-black border-white/10 text-white mt-1"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Make</Label>
                  <Input
                    value={nomineeForm.vehicle_make}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, vehicle_make: e.target.value })}
                    className="bg-black border-white/10 text-white mt-1"
                    placeholder="Ford"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Model</Label>
                  <Input
                    value={nomineeForm.vehicle_model}
                    onChange={(e) => setNomineeForm({ ...nomineeForm, vehicle_model: e.target.value })}
                    className="bg-black border-white/10 text-white mt-1"
                    placeholder="Mustang"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white/70">Wrap Title</Label>
                <Input
                  value={nomineeForm.wrap_title}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, wrap_title: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="Midnight Dragon"
                />
              </div>

              <div>
                <Label className="text-white/70">Description</Label>
                <Textarea
                  value={nomineeForm.wrap_description}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, wrap_description: e.target.value })}
                  className="bg-black border-white/10 text-white mt-1"
                  placeholder="Custom full wrap with..."
                />
              </div>

              <Button 
                onClick={saveNominee} 
                disabled={saving || !nomineeForm.artist_name || !nomineeForm.artist_instagram || !nomineeForm.week_of}
                className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-500"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editingNominee ? 'Update Nominee' : 'Add Nominee'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
