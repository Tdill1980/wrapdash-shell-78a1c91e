import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AffiliateFounder } from '../services/affiliateApi';

interface BusinessCardEditorProps {
  founder: AffiliateFounder;
  onSave: (updates: Partial<AffiliateFounder>) => void;
}

export const BusinessCardEditor = ({ founder, onSave }: BusinessCardEditorProps) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: founder.fullName || '',
    bio: founder.bio || '',
    companyName: founder.companyName || '',
    phone: founder.phone || '',
    avatarUrl: founder.avatarUrl || '',
    socialLinks: founder.socialLinks || {},
  });

  const handleSave = () => {
    onSave(formData);
    setEditing(false);
  };

  if (!editing) {
    return (
      <Card className="p-6 bg-[#16161E] border-[#ffffff0f]">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white">Business Card Profile</h3>
          <Button 
            onClick={() => setEditing(true)}
            className="bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white"
          >
            Edit Profile
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-[#B8B8C7]">Full Name</Label>
            <p className="text-white mt-1">{founder.fullName}</p>
          </div>
          
          {founder.companyName && (
            <div>
              <Label className="text-[#B8B8C7]">Company</Label>
              <p className="text-white mt-1">{founder.companyName}</p>
            </div>
          )}
          
          {founder.bio && (
            <div>
              <Label className="text-[#B8B8C7]">Bio</Label>
              <p className="text-white mt-1">{founder.bio}</p>
            </div>
          )}
          
          {founder.phone && (
            <div>
              <Label className="text-[#B8B8C7]">Phone</Label>
              <p className="text-white mt-1">{founder.phone}</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-[#16161E] border-[#ffffff0f]">
      <h3 className="text-lg font-semibold text-white mb-4">Edit Business Card</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-[#B8B8C7]">Full Name</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="companyName" className="text-[#B8B8C7]">Company Name</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="bio" className="text-[#B8B8C7]">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="phone" className="text-[#B8B8C7]">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="avatarUrl" className="text-[#B8B8C7]">Avatar URL</Label>
          <Input
            id="avatarUrl"
            value={formData.avatarUrl}
            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
            className="bg-[#0A0A0F] border-[#ffffff0f] text-white mt-1"
          />
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-[#00AFFF] to-[#0047FF] text-white"
          >
            Save Changes
          </Button>
          <Button 
            onClick={() => setEditing(false)}
            variant="outline"
            className="flex-1 border-[#ffffff0f] text-white"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};