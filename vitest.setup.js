import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import React from "react";

vi.mock("next/image", () => ({
  default: function MockImage({ src, alt, ...props }) {
    return React.createElement("img", { src, alt, ...props });
  },
}));
