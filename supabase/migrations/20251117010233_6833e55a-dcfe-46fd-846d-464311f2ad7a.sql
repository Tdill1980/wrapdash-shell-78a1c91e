-- Enable realtime for ApproveFlow tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.approveflow_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approveflow_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approveflow_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approveflow_actions;