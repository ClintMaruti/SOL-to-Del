import { Link } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  CircleHelp,
  IndentDecrease,
  IndentIncrease,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
} from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Input } from "./input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Separator } from "./separator";

export type RichTextEditorLabels = {
  headingSelect: string;
  paragraph: string;
  heading1: string;
  heading2: string;
  heading3: string;
  bold: string;
  italic: string;
  underline: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  alignJustify: string;
  bulletList: string;
  orderedList: string;
  outdent: string;
  indent: string;
  clearFormatting: string;
  help: string;
  toolbar: string;
  /** Insert or edit hyperlink */
  link: string;
  linkApply: string;
  unlink: string;
  linkUrlPlaceholder: string;
};

const defaultLabels: RichTextEditorLabels = {
  headingSelect: "Text style",
  paragraph: "Paragraph",
  heading1: "Heading 1",
  heading2: "Heading 2",
  heading3: "Heading 3",
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  alignLeft: "Align left",
  alignCenter: "Align center",
  alignRight: "Align right",
  alignJustify: "Align justify",
  bulletList: "Bullet list",
  orderedList: "Numbered list",
  outdent: "Decrease indent",
  indent: "Increase indent",
  clearFormatting: "Clear formatting",
  help: "Help",
  toolbar: "Formatting toolbar",
  link: "Link",
  linkApply: "Apply",
  unlink: "Remove link",
  linkUrlPlaceholder: "https://…",
};

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  labels?: Partial<RichTextEditorLabels>;
  onHelp?: () => void;
}

function mergeLabels(
  partial?: Partial<RichTextEditorLabels>
): RichTextEditorLabels {
  return { ...defaultLabels, ...partial };
}

function RichTextLinkPopover({
  editor,
  labels,
  disabled,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  labels: RichTextEditorLabels;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const href = editor.getAttributes("link").href;
    setUrl(typeof href === "string" ? href : "");
  }, [open, editor]);

  const applyLink = () => {
    const trimmed = url.trim();
    const chain = editor.chain().focus();
    if (editor.isActive("link")) {
      chain.extendMarkRange("link");
    }
    if (trimmed === "") {
      chain.unsetLink().run();
    } else {
      chain.setLink({ href: trimmed }).run();
    }
    setOpen(false);
  };

  React.useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label={labels.link}
          aria-pressed={editor.isActive("link")}
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
        >
          <Link2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <PopoverHeader>
          <PopoverTitle>{labels.link}</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Input
            size="sm"
            placeholder={labels.linkUrlPlaceholder}
            value={url}
            disabled={disabled}
            onChange={(e) => {
              setUrl(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex-1"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={applyLink}
            >
              {labels.linkApply}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || !editor.isActive("link")}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .unsetLink()
                  .run();
                setOpen(false);
              }}
            >
              {labels.unlink}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RichTextToolbar({
  editor,
  labels,
  onHelp,
  toolbarDisabled,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  labels: RichTextEditorLabels;
  onHelp?: () => void;
  toolbarDisabled?: boolean;
}) {
  const [, setTick] = React.useState(0);
  /** Preserved when opening the heading Select so blur does not collapse selection before apply. */
  const headingMenuSelectionRef = React.useRef<{
    from: number;
    to: number;
  } | null>(null);

  React.useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : editor.isActive("heading", { level: 3 })
        ? "3"
        : "p";

  return (
    <div
      role="toolbar"
      aria-label={labels.toolbar}
      className="flex w-full min-w-0 flex-wrap items-center gap-1 bg-white px-2 py-1.5 text-black [&_button]:!text-black [&_button:hover]:!text-black [&_span.text-sm]:font-bold [&_span.text-sm]:!text-black [&_svg]:shrink-0 [&_svg]:!text-black [&_svg]:stroke-current [&_svg]:[stroke-width:2.35px]"
    >
      <Select
        value={headingValue}
        onOpenChange={(open) => {
          if (open) {
            const { from, to } = editor.state.selection;
            headingMenuSelectionRef.current = { from, to };
          }
        }}
        onValueChange={(v) => {
          const saved = headingMenuSelectionRef.current;
          headingMenuSelectionRef.current = null;
          const chain = editor.chain().focus();
          if (saved) {
            chain.setTextSelection({ from: saved.from, to: saved.to });
          }
          if (v === "p") {
            chain.setParagraph().run();
            return;
          }
          const level = Number(v) as 1 | 2 | 3;
          chain.toggleHeading({ level }).run();
        }}
      >
        <SelectTrigger
          size="sm"
          className="min-w-[8.5rem]"
          onPointerDown={(e) => {
            const { from, to } = editor.state.selection;
            headingMenuSelectionRef.current = { from, to };
            e.preventDefault();
          }}
        >
          <SelectValue placeholder={labels.headingSelect} />
        </SelectTrigger>
        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <SelectItem value="p">{labels.paragraph}</SelectItem>
          <SelectItem value="1">{labels.heading1}</SelectItem>
          <SelectItem value="2">{labels.heading2}</SelectItem>
          <SelectItem value="3">{labels.heading3}</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={labels.bold}
        aria-pressed={editor.isActive("bold")}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="text-sm font-bold text-black">B</span>
      </Button>
      <Button
        type="button"
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={labels.italic}
        aria-pressed={editor.isActive("italic")}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="text-sm font-bold italic text-black">I</span>
      </Button>
      <Button
        type="button"
        variant={editor.isActive("underline") ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={labels.underline}
        aria-pressed={editor.isActive("underline")}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="text-sm font-bold underline text-black">U</span>
      </Button>

      <RichTextLinkPopover
        editor={editor}
        labels={labels}
        disabled={toolbarDisabled}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={labels.alignLeft}
        aria-pressed={editor.isActive({ textAlign: "left" })}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="size-4" />
      </Button>
      <Button
        type="button"
        variant={
          editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"
        }
        size="icon-sm"
        aria-label={labels.alignCenter}
        aria-pressed={editor.isActive({ textAlign: "center" })}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="size-4" />
      </Button>
      <Button
        type="button"
        variant={
          editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"
        }
        size="icon-sm"
        aria-label={labels.alignRight}
        aria-pressed={editor.isActive({ textAlign: "right" })}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="size-4" />
      </Button>
      <Button
        type="button"
        variant={
          editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"
        }
        size="icon-sm"
        aria-label={labels.alignJustify}
        aria-pressed={editor.isActive({ textAlign: "justify" })}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={labels.bulletList}
        aria-pressed={editor.isActive("bulletList")}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={labels.orderedList}
        aria-pressed={editor.isActive("orderedList")}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={labels.outdent}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
      >
        <IndentDecrease className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={labels.indent}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
      >
        <IndentIncrease className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={labels.clearFormatting}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
      >
        <RemoveFormatting className="size-4" />
      </Button>
      {onHelp ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={labels.help}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={onHelp}
        >
          <CircleHelp className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  labels: labelsProp,
  onHelp,
}: RichTextEditorProps) {
  const labels = React.useMemo(() => mergeLabels(labelsProp), [labelsProp]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          class:
            "text-[color:var(--link)] underline underline-offset-2 decoration-[color:var(--link)] cursor-text",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "max-w-none min-h-full px-6 py-3 text-sm text-[color:var(--foreground)] focus:outline-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-[color:var(--link)] [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-[color:var(--link)]",
      },
    },
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--input-border-default)] bg-[#F9FAFB]",
          className
        )}
      >
        <div className="h-12 w-full shrink-0 bg-white" />
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">
          <div className="mx-auto min-h-0 w-full max-w-3xl flex-1 bg-[color:var(--background)]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--input-border-default)] bg-[#F9FAFB]",
        className
      )}
    >
      <div className="w-full shrink-0 border-b border-[color:var(--input-border-default)] bg-white">
        <RichTextToolbar
          editor={editor}
          labels={labels}
          onHelp={onHelp}
          toolbarDisabled={disabled}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col bg-[#F9FAFB] px-3 pb-3 pt-2">
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden bg-white">
          <EditorContent
            editor={editor}
            className="rich-text-editor-content flex min-h-0 flex-1 flex-col overflow-y-auto [&_.tiptap]:min-h-full"
          />
        </div>
      </div>
    </div>
  );
}
