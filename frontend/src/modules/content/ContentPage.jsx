import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FileText } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  PageLoader,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import { cmsService } from "@/services";
import { ago } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ContentPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["cms"],
    queryFn: cmsService.list,
  });
  const [activeId, setActiveId] = useState();
  const [lang, setLang] = useState("en");
  const [draft, setDraft] = useState(null);
  const page = data?.find((p) => p.id === (activeId ?? data[0]?.id));

  useEffect(() => {
    if (page) setDraft(page);
  }, [page]);

  const save = useMutation({
    mutationFn: () => cmsService.update(draft.id, draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms"] });
      toast("Page published to the apps");
    },
  });

  if (isLoading || !data) return <PageLoader />;
  const dirty =
    !!draft && !!page && JSON.stringify(draft) !== JSON.stringify(page);
  const title = lang === "en" ? "title" : "titleAr";
  const body = lang === "en" ? "body" : "bodyAr";

  return (
    <>
      <PageHeader
        title="Content Pages"
        subtitle="Legal and info pages shown under Profile → Settings in the apps."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <Card padded={false} className="h-fit p-2">
          <ul>
            {data.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition",
                    p.id === page?.id
                      ? "bg-accent-soft text-primary"
                      : "hover:bg-bg",
                  )}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-white">
                    <FileText className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">
                      {p.title}
                    </span>
                    <span className="block text-[11px] text-ink-muted">
                      Updated {ago(p.updatedAt)}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-ink-muted rtl:rotate-180" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {draft && (
          <Card
            title={draft.title}
            action={
              <Tabs
                value={lang}
                onChange={setLang}
                tabs={[
                  { key: "en", label: "English" },
                  { key: "ar", label: "العربية" },
                ]}
              />
            }
          >
            <div className="space-y-4" dir={lang === "ar" ? "rtl" : undefined}>
              <Field label={lang === "en" ? "Title" : "العنوان"}>
                <Input
                  value={draft[title]}
                  onChange={(e) =>
                    setDraft({ ...draft, [title]: e.target.value })
                  }
                />
              </Field>
              <Field
                label={lang === "en" ? "Content" : "المحتوى"}
                hint="Plain text; blank lines start a new paragraph."
              >
                <Textarea
                  className="min-h-[340px]"
                  value={draft[body]}
                  onChange={(e) =>
                    setDraft({ ...draft, [body]: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-line/70 pt-4">
              <Button
                variant="secondary"
                disabled={!dirty}
                onClick={() => page && setDraft(page)}
              >
                Discard
              </Button>
              <Button
                disabled={!dirty}
                loading={save.isPending}
                onClick={() => save.mutate()}
              >
                Publish
              </Button>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
