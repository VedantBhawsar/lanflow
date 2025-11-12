import {
  DEFAULT_AGENT_API_KEY,
  DEFAULT_AGENT_LLM_PROVIDER,
  DEFAULT_AGENT_MODEL_NAME,
} from "@/customization/config-constants";
import { ENABLE_BUILDER_ONLY_MODE } from "@/customization/feature-flags";
import { getNodeInputColors } from "@/CustomNodes/helpers/get-node-input-colors";
import { getNodeInputColorsName } from "@/CustomNodes/helpers/get-node-input-colors-name";
import { sortToolModeFields } from "@/CustomNodes/helpers/sort-tool-mode-field";
import getFieldTitle from "@/CustomNodes/utils/get-field-title";
import useFlowStore from "@/stores/flowStore";
import { scapedJSONStringfy } from "@/utils/reactflowUtils";
import { useEffect, useMemo } from "react";
import NodeInputField from "../NodeInputField";

const RenderInputParameters = ({
  data,
  types,
  isToolMode,
  showNode,
  shownOutputs,
  showHiddenOutputs,
}) => {
  const setNode = useFlowStore((state) => state.setNode);

  // Set default values for hidden Agent fields in builder-only mode
  useEffect(() => {
    if (ENABLE_BUILDER_ONLY_MODE && data.node?.display_name === "Agent") {
      const updatedTemplate = { ...data.node.template };
      let hasChanges = false;

      // Set default API key if not already set
      if (updatedTemplate.api_key && !updatedTemplate.api_key.value) {
        updatedTemplate.api_key.value = DEFAULT_AGENT_API_KEY;
        hasChanges = true;
      }

      // Set default LLM provider if not already set
      if (updatedTemplate.agent_llm && !updatedTemplate.agent_llm.value) {
        updatedTemplate.agent_llm.value = DEFAULT_AGENT_LLM_PROVIDER;
        hasChanges = true;
      }

      // Set default model name if not already set
      if (updatedTemplate.model_name && !updatedTemplate.model_name.value) {
        updatedTemplate.model_name.value = DEFAULT_AGENT_MODEL_NAME;
        hasChanges = true;
      }

      // Update the node if changes were made
      if (hasChanges) {
        const updatedNode = { ...data.node, template: updatedTemplate };
        setNode(data.id, updatedNode);
      }
    }
  }, [data.id, data.node, setNode]);
  const templateFields = useMemo(() => {
    return Object.keys(data.node?.template || {})
      .filter((templateField) => templateField.charAt(0) !== "_")
      .sort((a, b) =>
        sortToolModeFields(
          a,
          b,
          data.node!.template,
          data.node?.field_order ?? [],
          isToolMode,
        ),
      );
  }, [data.node?.template, data.node?.field_order, isToolMode]);

  const shownTemplateFields = useMemo(() => {
    return templateFields.filter((templateField) => {
      const template = data.node?.template[templateField];

      // Hide Model Provider, Model Name, and API Key fields in builder-only mode for Agent nodes
      if (ENABLE_BUILDER_ONLY_MODE && data.node?.display_name === "Agent") {
        if (templateField === "agent_llm" || templateField === "api_key" || templateField === "model_name") {
          return false;
        }
      }

      return (
        template?.show &&
        !template?.advanced &&
        !(template?.tool_mode && isToolMode)
      );
    });
  }, [templateFields, data.node?.template, data.node?.display_name, isToolMode]); const memoizedColors = useMemo(() => {
    const colorMap = new Map();

    templateFields.forEach((templateField) => {
      const template = data.node?.template[templateField];
      if (template) {
        colorMap.set(templateField, {
          colors: getNodeInputColors(
            template.input_types,
            template.type,
            types,
          ),
          colorsName: getNodeInputColorsName(
            template.input_types,
            template.type,
            types,
          ),
        });
      }
    });

    return colorMap;
  }, [templateFields, types, data.node?.template]);

  const memoizedKeys = useMemo(() => {
    const keyMap = new Map();

    templateFields.forEach((templateField) => {
      const template = data.node?.template[templateField];
      if (template) {
        keyMap.set(
          templateField,
          scapedJSONStringfy({
            inputTypes: template.input_types,
            type: template.type,
            id: data.id,
            fieldName: templateField,
            proxy: template.proxy,
          }),
        );
      }
    });

    return keyMap;
  }, [templateFields, data.id, data.node?.template]);

  const renderInputParameter = shownTemplateFields.map(
    (templateField: string, idx: number) => {
      const template = data.node?.template[templateField];

      const memoizedColor = memoizedColors.get(templateField);
      const memoizedKey = memoizedKeys.get(templateField);

      return (
        <NodeInputField
          lastInput={
            !(shownOutputs.length > 0 || showHiddenOutputs) &&
            idx === shownTemplateFields.length - 1
          }
          key={memoizedKey}
          data={data}
          colors={memoizedColor.colors}
          title={getFieldTitle(data.node?.template!, templateField)}
          info={template.info!}
          name={templateField}
          tooltipTitle={template.input_types?.join("\n") ?? template.type}
          required={template.required}
          id={{
            inputTypes: template.input_types,
            type: template.type,
            id: data.id,
            fieldName: templateField,
          }}
          type={template.type}
          optionalHandle={template.input_types}
          proxy={template.proxy}
          showNode={showNode}
          colorName={memoizedColor.colorsName}
          isToolMode={isToolMode && template.tool_mode}
        />
      );
    },
  );

  return <>{renderInputParameter}</>;
};

export default RenderInputParameters;
