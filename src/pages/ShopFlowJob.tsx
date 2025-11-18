import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useShopFlowJob } from "@/modules/shopflow/hooks/useShopFlowJob";
import { ShopFlowStatusBadge } from "@/modules/shopflow/components/ShopFlowStatusBadge";
import {
  ArrowLeft,
  User,
  Package,
  Calendar,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statusOptions = [
  { value: "processing", label: "New" },
  { value: "missing-file", label: "Missing File" },
  { value: "file-error", label: "File Error" },
  { value: "in-design", label: "In Design" },
  { value: "design-complete", label: "Design Complete" },
  { value: "print-production", label: "Print Production" },
  { value: "lamination", label: "Lamination" },
  { value: "finishing", label: "Finishing" },
  { value: "ready-for-pickup", label: "Ready For Pickup" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
];

export default function ShopFlowJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { job, loading, updateJobStatus, updateJobNotes } = useShopFlowJob(id);
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (loading || !job) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/shopflow")}
          className="text-[#B8B8C7] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to ShopFlow
        </Button>
        <Card className="bg-[#16161E] border border-white/[0.06] p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#8FD3FF] mx-auto" />
          <p className="text-[#B8B8C7] mt-4">Loading job details...</p>
        </Card>
      </div>
    );
  }

  const vehicleInfo = job.vehicle_info || {};
  const vehicleDisplay = vehicleInfo.year && vehicleInfo.make && vehicleInfo.model
    ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
    : "No vehicle info";

  const files = Array.isArray(job.files) ? job.files : [];

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await updateJobStatus(newStatus);
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updateJobNotes(notes);
      setEditingNotes(false);
      toast.success("Notes saved successfully");
    } catch (error) {
      toast.error("Failed to save notes");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/shopflow")}
        className="text-[#B8B8C7] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to ShopFlow
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] bg-clip-text text-transparent">
            Order #{job.order_number}
          </h1>
          <p className="text-[#B8B8C7] mt-1">{job.customer_name}</p>
        </div>
        <ShopFlowStatusBadge status={job.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Job Info */}
          <Card className="bg-[#16161E] border border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#8FD3FF]" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[#B8B8C7]">Product Type</Label>
                <p className="text-white mt-1">{job.product_type}</p>
              </div>
              <div>
                <Label className="text-[#B8B8C7]">Created</Label>
                <p className="text-white mt-1">
                  {format(new Date(job.created_at), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              <div>
                <Label className="text-[#B8B8C7]">Last Updated</Label>
                <p className="text-white mt-1">
                  {format(new Date(job.updated_at), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="bg-[#16161E] border border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-[#8FD3FF]" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[#B8B8C7]">Name</Label>
                <p className="text-white mt-1">{job.customer_name}</p>
              </div>
              {job.customer_email && (
                <div>
                  <Label className="text-[#B8B8C7]">Email</Label>
                  <p className="text-white mt-1">{job.customer_email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card className="bg-[#16161E] border border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#8FD3FF]" />
                Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white">{vehicleDisplay}</p>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card className="bg-[#16161E] border border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={job.status}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className="bg-[#101016] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#16161E] border-white/10">
                  {statusOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-white hover:bg-white/5"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Files */}
          <Card className="bg-[#16161E] border border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8FD3FF]" />
                Artwork Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-[#B8B8C7]">No files uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {files.map((file: any, i: number) => {
                    const isImage = file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-[#101016] border border-white/10 rounded-lg p-3"
                      >
                        {isImage ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#16161E] border border-white/10 rounded flex items-center justify-center">
                            <FileText className="w-6 h-6 text-[#8FD3FF]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{file.name}</p>
                        </div>
                        {file.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(file.url, "_blank")}
                            className="text-[#8FD3FF] hover:bg-white/5"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-[#16161E] border border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white">Staff Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingNotes ? (
                <>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    className="bg-[#101016] border-white/10 text-white placeholder:text-[#B8B8C7] min-h-[120px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveNotes}
                      className="bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white"
                    >
                      Save Notes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingNotes(false);
                        setNotes("");
                      }}
                      className="border-white/10 text-[#B8B8C7]"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {job.notes ? (
                    <p className="text-white whitespace-pre-wrap">{job.notes}</p>
                  ) : (
                    <p className="text-[#B8B8C7]">No notes yet</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotes(job.notes || "");
                      setEditingNotes(true);
                    }}
                    className="border-white/10 text-[#8FD3FF] hover:bg-white/5"
                  >
                    {job.notes ? "Edit Notes" : "Add Notes"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* ApproveFlow Link */}
          {job.approveflow_project_id && (
            <Card className="bg-[#16161E] border border-white/[0.06]">
              <CardContent className="pt-6">
                <Button
                  onClick={() => navigate(`/approveflow/${job.approveflow_project_id}`)}
                  className="w-full bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in ApproveFlow
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Chat Placeholder */}
          <Card className="bg-[#16161E] border border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white">Customer Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#B8B8C7] text-sm mb-4">
                Send status updates to customer
              </p>
              <Button
                className="w-full bg-gradient-to-r from-[#8FD3FF] to-[#0047FF] text-white"
                disabled
              >
                Send Update
              </Button>
              <p className="text-xs text-[#B8B8C7] mt-2 text-center">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
