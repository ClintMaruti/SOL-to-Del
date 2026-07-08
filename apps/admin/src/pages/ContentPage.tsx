import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@sol/ui";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ROUTES } from "@/shared/lib/paths";
import { ContentBlocksList } from "@/widgets/content-blocks-list";
import { DocumentTemplatesList } from "@/widgets/document-templates-list";

const TAB_PARAM = "tab";
const DEFAULT_TAB = "content-blocks";
const DOCUMENT_TEMPLATES_TAB = "document-templates";

export function ContentPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation(["admin", "common"]);

  const activeTab =
    searchParams.get(TAB_PARAM) === DOCUMENT_TEMPLATES_TAB
      ? DOCUMENT_TEMPLATES_TAB
      : DEFAULT_TAB;

  const handleCreateContentBlock = () => {
    navigate(ROUTES.DATABASE_CONTENT_BLOCK_CREATE);
  };

  const handleTabChange = (value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (value === DOCUMENT_TEMPLATES_TAB) {
      nextSearchParams.set(TAB_PARAM, DOCUMENT_TEMPLATES_TAB);
    } else {
      nextSearchParams.delete(TAB_PARAM);
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100vh-var(--layout-reserved-footer-height,0px)-4rem)] flex-col gap-4 p-4">
      <div className="flex shrink-0 items-start justify-between">
        <div className="flex-1">
          <h1 className="leading-10 text-text-primary font-bold text-2xl">
            {t("admin:sidebar.content")}
          </h1>
          <p className="max-w-2xl leading-6 text-text-secondary text-sm font-medium">
            {t("admin:pages.contentDescription")}
          </p>
        </div>
        {activeTab === DEFAULT_TAB ? (
          <Button
            onClick={handleCreateContentBlock}
            variant="primary"
            className="shrink-0"
          >
            <Plus />
            {t("common:buttons.create")}
          </Button>
        ) : null}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 w-full flex-1 flex-col gap-4"
      >
        <TabsList className="shrink-0">
          <TabsTrigger value="content-blocks">
            {t("admin:contentBlocks.tabContentBlocks")}
          </TabsTrigger>
          <TabsTrigger value={DOCUMENT_TEMPLATES_TAB}>
            {t("admin:contentBlocks.tabDocumentTemplates")}
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="content-blocks"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <ContentBlocksList
              onCreateContentBlock={handleCreateContentBlock}
            />
          </div>
        </TabsContent>
        <TabsContent
          value={DOCUMENT_TEMPLATES_TAB}
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <DocumentTemplatesList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
