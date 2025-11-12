import { HelpDropdownView } from "@/components/core/canvasControlsComponent/HelpDropdownView";
import {
  BUG_REPORT_URL,
  DATASTAX_DOCS_URL,
  DESKTOP_URL,
  DOCS_URL,
} from "@/constants/constants";
import {
  ENABLE_BUILDER_ONLY_MODE,
  ENABLE_DATASTAX_LANGFLOW,
} from "@/customization/feature-flags";
import useFlowStore from "@/stores/flowStore";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

const HelpDropdown = () => {
  // Hide Help dropdown in builder-only mode
  if (ENABLE_BUILDER_ONLY_MODE) {
    return null;
  }

  const navigate = useNavigate();
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const helperLineEnabled = useFlowStore((state) => state.helperLineEnabled);
  const setHelperLineEnabled = useFlowStore(
    (state) => state.setHelperLineEnabled,
  );

  const onToggleHelperLines = useCallback(() => {
    setHelperLineEnabled(!helperLineEnabled);
  }, [helperLineEnabled, setHelperLineEnabled]);

  const docsUrl = ENABLE_DATASTAX_LANGFLOW ? DATASTAX_DOCS_URL : DOCS_URL;

  return (
    <HelpDropdownView
      isOpen={isHelpMenuOpen}
      onOpenChange={setIsHelpMenuOpen}
      helperLineEnabled={helperLineEnabled}
      onToggleHelperLines={onToggleHelperLines}
      navigateTo={(path) => navigate(path)}
      openLink={(url) => window.open(url, "_blank")}
      urls={{ docs: docsUrl, bugReport: BUG_REPORT_URL, desktop: DESKTOP_URL }}
    />
  );
};

export default HelpDropdown;
