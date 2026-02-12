/**
 * Mock implementations for document parsing libraries
 * This file provides fallback functionality when the actual libraries fail to load
 */

export const mockMammoth = {
  extractRawText: async ({ arrayBuffer }: { arrayBuffer: ArrayBuffer }) => {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      value:
        `This is mock content extracted from a DOCX file.\n\n` +
        `The file size is approximately ${(arrayBuffer.byteLength / 1024).toFixed(1)} KB.\n\n` +
        `This is a fallback parser used when the mammoth library is not available or encounters errors.\n\n` +
        `In a production environment, you would see the actual content of your document here.`,
      messages: [],
    }
  },
}

export const mockPdfJs = {
  getDocument: ({ data }: { data: ArrayBuffer }) => {
    return {
      promise: new Promise((resolve) => {
        // Simulate processing time
        setTimeout(() => {
          resolve({
            numPages: Math.ceil(data.byteLength / 10000), // Simulate number of pages based on file size
            getPage: async (pageNum: number) => {
              return {
                getTextContent: async () => {
                  return {
                    items: [
                      { str: `This is mock content from page ${pageNum} of a PDF file.\n\n` },
                      { str: `The file size is approximately ${(data.byteLength / 1024).toFixed(1)} KB.\n\n` },
                      {
                        str: `This is a fallback parser used when the PDF.js library is not available or encounters errors.\n\n`,
                      },
                      { str: `In a production environment, you would see the actual content of your document here.` },
                    ],
                  }
                },
              }
            },
          })
        }, 500)
      }),
    }
  },
  version: "3.11.174",
}

export const mockPptxParser = {
  parse: async (buffer: ArrayBuffer) => {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Simulate number of slides based on file size
    const numSlides = Math.ceil(buffer.byteLength / 20000)

    const slides = Array.from({ length: numSlides }, (_, i) => ({
      shapes: [
        {
          text:
            `This is mock content from slide ${i + 1} of a PPT/PPTX file.\n\n` +
            `The file size is approximately ${(buffer.byteLength / 1024).toFixed(1)} KB.\n\n` +
            `This is a fallback parser used when the PPTX parser library is not available or encounters errors.\n\n` +
            `In a production environment, you would see the actual content of your presentation here.`,
        },
      ],
    }))

    return { slides }
  },
}
