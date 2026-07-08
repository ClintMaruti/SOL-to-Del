import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DocumentTemplateDetail } from "@/entities/document-template";
import { useUpdateDocumentTemplate } from "@/entities/document-template";
import { useUnsavedChangesBlocker } from "@/shared/hooks";

import { useDocumentTemplateBuilderState } from "../model/useDocumentTemplateBuilderState";

vi.mock("@/entities/document-template", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/document-template")>();

  return {
    ...actual,
    useUpdateDocumentTemplate: vi.fn(),
  };
});

vi.mock("@/shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/hooks")>();

  return {
    ...actual,
    useUnsavedChangesBlocker: vi.fn(),
  };
});

const mockUseUpdateDocumentTemplate = vi.mocked(useUpdateDocumentTemplate);
const mockUseUnsavedChangesBlocker = vi.mocked(useUnsavedChangesBlocker);

const template: DocumentTemplateDetail = {
  id: "tpl-1",
  title: "Quote",
  version: 1,
  items: [
    {
      id: "section-1",
      kind: "Section",
      sortOrder: 1,
      documentId: "tpl-1",
      version: 1,
      sectionTitle: "General",
      items: [
        {
          id: "content-1",
          kind: "Content",
          sortOrder: 1,
          documentId: "tpl-1",
          version: 1,
          source: "GLOBAL",
          contentBlockId: "cb-1",
        },
      ],
    },
  ],
};

const savedTemplate: DocumentTemplateDetail = {
  id: "tpl-1",
  title: "Quote",
  version: 2,
  items: [
    {
      id: "section-1",
      kind: "Section",
      sortOrder: 1,
      documentId: "tpl-1",
      version: 2,
      sectionTitle: "Updated section",
      items: [
        {
          id: "content-1",
          kind: "Content",
          sortOrder: 1,
          documentId: "tpl-1",
          version: 2,
          source: "GLOBAL",
          contentBlockId: "cb-1",
        },
      ],
    },
  ],
};

describe("useDocumentTemplateBuilderState", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseUnsavedChangesBlocker.mockImplementation((options) => ({
      showUnsavedDialog: false,
      handleCancel: vi.fn(),
      handleUnsavedDiscard: () => options.onPrepareDiscard(),
      handleUnsavedStay: vi.fn(),
      scheduleNavigateAfterSave: vi.fn(),
    }));

    mockUseUpdateDocumentTemplate.mockReturnValue({
      mutate: vi.fn((_payload, options) => {
        options?.onSuccess?.(savedTemplate, undefined, undefined);
      }),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateDocumentTemplate>);
  });

  it("clears dirty state after save and discards back to the latest saved template", () => {
    const { result } = renderHook(() =>
      useDocumentTemplateBuilderState(template)
    );

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.handleSectionTitleChange("section-1", "Updated section");
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.handleSave();
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.items[0]?.version).toBe(2);
    expect(result.current.items[0]).toMatchObject({
      sectionTitle: "Updated section",
    });

    act(() => {
      result.current.handleSectionTitleChange("section-1", "Changed again");
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.handleUnsavedDiscard();
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.items[0]).toMatchObject({
      sectionTitle: "Updated section",
      version: 2,
    });
  });
});
