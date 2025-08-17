import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = formData.get("action") as string;
    const apiType = (formData.get("apiType") as string) || "cartoon";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_LIGHTX_API_KEY || "";

    console.log("[v0] API Key being used:", apiKey ? "Present" : "Missing");
    console.log("[v0] Action:", action);
    console.log("[v0] API Type:", apiType);

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    if (action === "generate_face") {
      // Step 1: Get upload URL
      console.log("[v0] Requesting upload URL with:", {
        uploadType: "imageUrl",
        size: file.size,
        contentType: file.type,
      });

      const uploadResponse = await fetch(
        "https://api.lightxeditor.com/external/api/v2/uploadImageUrl",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            uploadType: "imageUrl",
            size: file.size,
            contentType: file.type,
          }),
        }
      );

      console.log("[v0] Upload response status:", uploadResponse.status);
      console.log(
        "[v0] Upload response headers:",
        Object.fromEntries(uploadResponse.headers.entries())
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.log("[v0] Upload error response:", errorText);

        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }

        return NextResponse.json(
          {
            error: "Failed to get upload URL",
            details: error,
            status: uploadResponse.status,
          },
          { status: uploadResponse.status }
        );
      }

      const uploadData = await uploadResponse.json();
      console.log(
        "[v0] Upload data received:",
        JSON.stringify(uploadData, null, 2)
      );

      const { uploadImage, imageUrl } = uploadData.body;
      console.log("[v0] Upload image URL:", uploadImage);
      console.log("[v0] Final image URL:", imageUrl);

      if (!uploadImage || !imageUrl) {
        console.log("[v0] Missing required fields in upload response");
        return NextResponse.json(
          {
            error: "Invalid upload response",
            details: { uploadImage: !!uploadImage, imageUrl: !!imageUrl },
          },
          { status: 500 }
        );
      }

      // Step 2: Upload image to the upload URL
      console.log("[v0] Starting image upload to:", uploadImage);
      const putResponse = await fetch(uploadImage, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      console.log("[v0] Image upload response status:", putResponse.status);
      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        console.log("[v0] Image upload error:", errorText);
        return NextResponse.json(
          { error: "Failed to upload image", details: errorText },
          { status: putResponse.status }
        );
      }

      const template = formData.get("template") as string;
      const textPrompt =
        (formData.get("textPrompt") as string) || getDefaultPrompt(apiType);

      console.log("[v0] Starting generation with:", {
        apiType,
        imageUrl,
        template,
        textPrompt,
      });

      let apiEndpoint: string;
      let requestBody: any;
      let statusEndpoint: string;

      switch (apiType) {
        case "hairstyle":
          apiEndpoint =
            "https://api.lightxeditor.com/external/api/v1/hairstyle";
          requestBody = {
            imageUrl: imageUrl,
            textPrompt: textPrompt || "modern hairstyle",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "haircolor":
          apiEndpoint =
            "https://api.lightxeditor.com/external/api/v2/haircolor/";
          requestBody = {
            imageUrl: imageUrl,
            textPrompt: textPrompt || "blonde hair color",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v2/order-status";
          break;

        case "outfit":
          apiEndpoint = "https://api.lightxeditor.com/external/api/v1/outfit";
          requestBody = {
            imageUrl: imageUrl,
            textPrompt: textPrompt || "casual outfit",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "virtualtryon":
          apiEndpoint =
            "https://api.lightxeditor.com/external/api/v2/aivirtualtryon";
          requestBody = {
            imageUrl: imageUrl,
            styleImageUrl:
              template ||
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v2/order-status";
          break;

        case "faceswap":
          apiEndpoint =
            "https://api.lightxeditor.com/external/api/v1/face-swap";
          requestBody = {
            imageUrl: imageUrl,
            styleImageUrl:
              template ||
              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "portrait":
          apiEndpoint = "https://api.lightxeditor.com/external/api/v1/portrait";
          requestBody = {
            imageUrl: imageUrl,
            textPrompt: textPrompt || "professional portrait style",
            styleImageUrl: template || undefined,
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "replace":
          apiEndpoint = "https://api.lightxeditor.com/external/api/v1/replace";
          requestBody = {
            imageUrl: imageUrl,
            maskedImageUrl: template || imageUrl, // For replace API, template should be the masked image
            textPrompt: textPrompt || "replace with modern style",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "cartoon":
          apiEndpoint = "https://api.lightxeditor.com/external/api/v1/cartoon";
          requestBody = {
            imageUrl: imageUrl,
            styleImageUrl: template || undefined,
            textPrompt: textPrompt || "cartoon character style",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "caricature":
          apiEndpoint =
            "https://api.lightxeditor.com/external/api/v1/caricature";
          requestBody = {
            imageUrl: imageUrl,
            styleImageUrl: template || undefined,
            textPrompt:
              textPrompt || "funny caricature with exaggerated features",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "avatar":
          apiEndpoint = "https://api.lightxeditor.com/external/api/v1/avatar";
          requestBody = {
            imageUrl: imageUrl,
            styleImageUrl: template || undefined,
            textPrompt: textPrompt || "professional avatar style",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        default:
          // Default to cartoon generation for backward compatibility
          apiEndpoint = "https://api.lightxeditor.com/external/api/v1/cartoon";
          requestBody = {
            imageUrl: imageUrl,
            styleImageUrl: template || undefined,
            textPrompt: textPrompt || "cartoon character",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;
      }

      const generationResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        "[v0] Generation response status:",
        generationResponse.status
      );
      if (!generationResponse.ok) {
        const errorText = await generationResponse.text();
        console.log("[v0] Generation error:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }
        return NextResponse.json(
          { error: `Failed to generate ${apiType}`, details: error },
          { status: generationResponse.status }
        );
      }

      const generationData = await generationResponse.json();
      console.log(
        "[v0] Generation data received:",
        JSON.stringify(generationData, null, 2)
      );
      const { orderId } = generationData.body;

      if (!orderId) {
        console.log("[v0] No orderId in generation response");
        return NextResponse.json(
          { error: "No order ID received" },
          { status: 500 }
        );
      }

      console.log("[v0] Starting polling for order:", orderId);

      // Step 4: Poll for result using the appropriate status endpoint
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries) {
        console.log(
          `[v0] Polling attempt ${retries + 1}/${maxRetries} for order:`,
          orderId
        );
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

        try {
          const statusResponse = await fetch(statusEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({
              orderId: orderId,
            }),
          });

          console.log(
            `[v0] Status response ${retries + 1} status:`,
            statusResponse.status
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log(
              `[v0] Status data ${retries + 1}:`,
              JSON.stringify(statusData, null, 2)
            );

            const { status, output } = statusData.body || {};
            console.log(
              `[v0] Order status: ${status}, has output: ${!!output}`
            );

            if (status === "active") {
              console.log(
                "[v0] Generation completed successfully, returning result"
              );
              return NextResponse.json({
                success: true,
                imageUrl: output,
                orderId: orderId,
              });
            } else if (status === "failed") {
              console.log("[v0] Generation failed according to status");
              return NextResponse.json(
                { error: "Generation failed" },
                { status: 500 }
              );
            } else {
              console.log(`[v0] Status still ${status}, continuing to poll...`);
            }
          } else {
            const errorText = await statusResponse.text();
            console.log(
              `[v0] Status request ${retries + 1} failed:`,
              statusResponse.status,
              errorText
            );
          }
        } catch (pollError: any) {
          console.log(
            `[v0] Polling attempt ${retries + 1} threw error:`,
            pollError.message
          );
        }

        retries++;
      }

      console.log("[v0] Polling completed, max retries reached");
      return NextResponse.json(
        { error: "Generation timeout" },
        { status: 408 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[v0] LightX API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

function getDefaultPrompt(apiType: string): string {
  switch (apiType) {
    case "hairstyle":
      return "modern stylish hairstyle";
    case "haircolor":
      return "natural hair color change";
    case "outfit":
      return "stylish casual outfit";
    case "virtualtryon":
      return "";
    case "faceswap":
      return "";
    case "portrait":
      return "professional portrait style";
    case "replace":
      return "replace with modern style";
    case "cartoon":
      return "cartoon character style";
    case "caricature":
      return "funny caricature with exaggerated features";
    case "avatar":
      return "professional avatar style";
    default:
      return "cartoon character";
  }
}
