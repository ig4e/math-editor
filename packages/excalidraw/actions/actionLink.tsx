import { getContextMenuLabel } from "../components/hyperlink/Hyperlink";
import { LinkIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { isEmbeddableElement } from "../element/typeChecks";
import { t } from "../i18n";
import { getSelectedElements } from "../scene";
import { CaptureUpdateAction } from "../store";
import { register } from "./register";

export const actionLink = register({
  name: "hyperlink",
  label: (elements, appState) => getContextMenuLabel(elements, appState),
  icon: LinkIcon,
  perform: (elements, appState) => {
    if (appState.showHyperlinkPopup === "editor") {
      return false;
    }

    return {
      elements,
      appState: {
        ...appState,
        showHyperlinkPopup: "editor",
        openMenu: null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  trackEvent: { category: "hyperlink", action: "click" },
  // Upstream binds Ctrl/Cmd+K to "add hyperlink". The math-editor app
  // owns Ctrl+K for its command palette (cmdk), so the keyTest is
  // removed — the action is still reachable from menus/context-menu.
  // The block-embed link-hint UI is hidden too (see Hyperlink.tsx).
  predicate: (elements, appState) => {
    const selectedElements = getSelectedElements(elements, appState);
    return selectedElements.length === 1;
  },
  PanelComponent: ({ elements, appState, updateData }) => {
    const selectedElements = getSelectedElements(elements, appState);

    return (
      <ToolButton
        type="button"
        icon={LinkIcon}
        aria-label={t(getContextMenuLabel(elements, appState))}
        title={
          isEmbeddableElement(elements[0])
            ? t("labels.link.labelEmbed")
            : t("labels.link.label")
        }
        onClick={() => updateData(null)}
        selected={selectedElements.length === 1 && !!selectedElements[0].link}
      />
    );
  },
});
