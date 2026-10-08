import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Navigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button, Card, PageLoader, useToast } from "@/components/ui";
import { cmsService } from "@/services";

export function ContentPage() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["cms", slug],
    queryFn: () => cmsService.get(slug),
    enabled: !!slug
  });

  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (page) setDraft(page);
  }, [page]);

  const save = useMutation({
    mutationFn: () => cmsService.update(draft.id, draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms", slug] });
      toast("CMS page updated successfully!");
    },
    onError: () => {
      toast("Failed to update CMS page");
    }
  });

  if (!slug) return <Navigate to="/cms/aboutUs" replace />;
  if (isLoading) return <PageLoader />;
  if (error || !page) return <div className="p-8 text-center text-ink-muted">Page not found</div>;

  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(page);

  return (
    <Card padded={false} className="overflow-hidden bg-white border border-line">
      <div className="border-b border-line p-4 text-[13px] font-medium text-ink-muted">
        Content
      </div>
      <div className="p-4">
        <ReactQuill
          theme="snow"
          value={draft?.body || ""}
          onChange={(value) => setDraft((d) => ({ ...d, body: value }))}
          className="h-[400px] mb-12"
        />
      </div>
      <div className="flex justify-end border-t border-line bg-surface-soft p-4">
        <Button
          className="bg-[#ff1e56] hover:bg-[#ff1e56]/90 text-white rounded-full px-8"
          disabled={!dirty}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          UPDATE
        </Button>
      </div>
    </Card>
  );
}
