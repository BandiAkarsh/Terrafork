import { describe, it, expect } from "vitest";

describe("URL Validation Utilities", () => {
  describe("Recipe URL validation", () => {
    it("should validate HTTPS URLs", () => {
      const isValidUrl = (url: string): boolean => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === "https:" || parsed.protocol === "http:";
        } catch {
          return false;
        }
      };

      expect(isValidUrl("https://example.com/recipe")).toBe(true);
      expect(isValidUrl("http://example.com/recipe")).toBe(true);
      expect(isValidUrl("ftp://example.com")).toBe(false);
      expect(isValidUrl("not-a-url")).toBe(false);
    });

    it("should extract hostname from URL", () => {
      const getHostname = (url: string): string => {
        try {
          return new URL(url).hostname;
        } catch {
          return "";
        }
      };

      expect(getHostname("https://www.example.com/path/to/recipe")).toBe("www.example.com");
      expect(getHostname("https://recipeblog.com/123")).toBe("recipeblog.com");
      expect(getHostname("invalid")).toBe("");
    });
  });

  describe("SSRF Protection", () => {
    it("should detect private IP addresses", () => {
      const isPrivateIP = (ip: string): boolean => {
        const privateRanges = [
          /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
          /^192\.168\.\d{1,3}\.\d{1,3}$/,
          /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
          /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
        ];
        return privateRanges.some(range => range.test(ip));
      };

      expect(isPrivateIP("192.168.1.1")).toBe(true);
      expect(isPrivateIP("10.0.0.1")).toBe(true);
      expect(isPrivateIP("172.16.0.1")).toBe(true);
      expect(isPrivateIP("8.8.8.8")).toBe(false);
      expect(isPrivateIP("203.0.113.1")).toBe(false);
    });

    it("should detect localhost URLs", () => {
      const isLocalhost = (url: string): boolean => {
        try {
          const hostname = new URL(url).hostname;
          return hostname === "localhost" || hostname === "127.0.0.1";
        } catch {
          return false;
        }
      };

      expect(isLocalhost("http://localhost:3000/recipe")).toBe(true);
      expect(isLocalhost("http://127.0.0.1:8080")).toBe(true);
      expect(isLocalhost("https://example.com")).toBe(false);
    });
  });
});

describe("Data Serialization", () => {
  describe("Recipe data handling", () => {
    it("should handle JSON serialization safely", () => {
      const safelyStringify = (obj: unknown): string => {
        try {
          return JSON.stringify(obj);
        } catch {
          return "{}";
        }
      };

      const testObj = { name: "test", value: 123, nested: { a: 1 } };
      const result = safelyStringify(testObj);
      expect(result).toBe('{"name":"test","value":123,"nested":{"a":1}}');
    });

    it("should handle circular references gracefully", () => {
      const safelyStringify = (obj: unknown): string => {
        try {
          return JSON.stringify(obj);
        } catch {
          return "{}";
        }
      };

      const circular: Record<string, unknown> = { name: "test" };
      circular.self = circular;

      const result = safelyStringify(circular);
      expect(result).toBe("{}");
    });
  });
});
