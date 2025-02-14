import {
  ChakraProvider,
  defaultConfig,
  mergeConfigs,
  createSystem,
  defineConfig,
} from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#ffffff" },
          100: { value: "#e6f1fc" },
          200: { value: "#cce3f9" },
          300: { value: "#4d9ceb" },
          400: { value: "#1a7fe6" },
          500: { value: "#0071e3" },
          600: { value: "#0066cc" },
          700: { value: "#004f9f" },
          800: { value: "#003972" },
          900: { value: "#002244" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: { base: "{colors.brand.500}" } },
          contrast: { value: { base: "{colors.brand.50}" } },
          fg: { value: { base: "{colors.brand.500}" } },
          muted: {
            value: {
              base: "{colors.brand.200}",
              _dark: "{colors.whiteAlpha.400}",
            },
          },
          subtle: {
            value: {
              base: "{colors.brand.100}",
              _dark: "{colors.whiteAlpha.200}",
            },
          },
          emphasized: { value: { base: "{colors.brand.300}" } },
          focusRing: { value: { base: "{colors.brand.500}" } },
          outline: {
            value: {
              base: "{colors.blackAlpha.200}",
              _dark: "{colors.whiteAlpha.200}",
            },
          },
          gray: {
            value: {
              base: "{colors.blackAlpha.50}",
              _dark: "{colors.whiteAlpha.50}",
            },
          },
          "gray.100": {
            value: {
              base: "{colors.blackAlpha.100}",
              _dark: "{colors.whiteAlpha.100}",
            },
          },
          white: {
            value: {
              base: "{colors.white}",
              _dark: "{colors.black}",
            },
          },
        },
      },
    },
  },
});

const system = createSystem(mergeConfigs(defaultConfig, config));

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  );
}
