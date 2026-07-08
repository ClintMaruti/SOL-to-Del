import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { useDocumentTemplate } from "@/entities/document-template";
import { ROUTES } from "@/shared/lib/paths";
import { ResourceNotFound } from "@/shared/ui";
import {
  DocumentTemplateBuilder,
  DocumentTemplateBuilderSkeleton,
} from "@/widgets/document-template-builder";

const TEMPLATE_EXIT_PATH = `${ROUTES.DATABASE_CONTENT}?tab=document-templates`;
const PAGE_SHELL_CLASS =
  "flex h-[calc(100vh-var(--layout-reserved-footer-height,0px)-4rem)] min-h-0 flex-col overflow-hidden";

export function DocumentTemplateDetailPage() {
  const { documentTemplateId } = useParams<{ documentTemplateId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const {
    data: documentTemplate,
    isLoading,
    error,
  } = useDocumentTemplate(documentTemplateId);

  if (isLoading) {
    return (
      <div className={PAGE_SHELL_CLASS}>
        <DocumentTemplateBuilderSkeleton />
      </div>
    );
  }

  if (error || !documentTemplate) {
    return (
      <div className={`${PAGE_SHELL_CLASS} px-6 py-6`}>
        <ResourceNotFound
          title={t("notFound.documentTemplate")}
          description={t("notFound.documentTemplateDescription")}
          actionLabel={t("buttons.backToContent")}
          onAction={() => navigate(TEMPLATE_EXIT_PATH)}
        />
      </div>
    );
  }

  return (
    <div className={PAGE_SHELL_CLASS}>
      <DocumentTemplateBuilder
        key={`${documentTemplate.id}-${documentTemplate.version}`}
        template={documentTemplate}
      />
    </div>
  );
}
