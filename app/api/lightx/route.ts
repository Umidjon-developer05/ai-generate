import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const styleImageFile = formData.get("styleImage") as File | null;
    const action = formData.get("action") as string;
    const apiType = (formData.get("apiType") as string) || "cartoon";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey =
      "35c3896e991c412b8836b8a6a6feb972_50c858bdc1e14c63b6731fa409dbafd6_andoraitools";

    console.log("[v0] API Key being used:", apiKey ? "Present" : "Missing");
    console.log("[v0] Action:", action);
    console.log("[v0] API Type:", apiType);

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    if (action === "check_balance") {
      try {
        const balanceEndpoint =
          "https://api.lightxeditor.com/external/api/v1/creditsInfo";

        console.log("[v0] Trying balance endpoint:", balanceEndpoint);

        const authHeaders = [
          { Authorization: `Bearer ${apiKey}` },
          { Authorization: apiKey },
          { "x-api-key": apiKey },
          { "api-key": apiKey },
          { "X-API-Key": apiKey },
        ];

        let balanceResponse = null;
        let lastError = null;

        for (const headers of authHeaders) {
          try {
            console.log("[v0] Trying auth headers:", Object.keys(headers));
            const mergedHeaders: HeadersInit = Object.fromEntries(
              Object.entries({
                "Content-Type": "application/json",
                ...headers,
              }).filter(([_, v]) => typeof v === "string")
            );
            balanceResponse = await fetch(balanceEndpoint, {
              method: "GET",
              headers: mergedHeaders,
            });

            console.log(
              "[v0] Balance response status:",
              balanceResponse.status
            );

            if (balanceResponse.ok) {
              break; // Success, exit the loop
            } else {
              const errorText = await balanceResponse.text();
              lastError = errorText;
              console.log("[v0] Auth attempt failed:", errorText);
            }
          } catch (error: any) {
            lastError = error.message;
            console.log("[v0] Auth attempt error:", error.message);
          }
        }

        if (balanceResponse && balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          console.log(
            "[v0] Balance data received:",
            JSON.stringify(balanceData, null, 2)
          );

          // Extract balance from various possible response formats
          let credits = null;
          if (balanceData.balance !== undefined) credits = balanceData.balance;
          else if (balanceData.credits !== undefined)
            credits = balanceData.credits;
          else if (balanceData.body?.balance !== undefined)
            credits = balanceData.body.balance;
          else if (balanceData.body?.credits !== undefined)
            credits = balanceData.body.credits;
          else if (balanceData.data?.balance !== undefined)
            credits = balanceData.data.balance;
          else if (balanceData.data?.credits !== undefined)
            credits = balanceData.data.credits;

          if (credits !== null) {
            return NextResponse.json({
              success: true,
              balance: {
                credits: credits,
                plan: balanceData.plan || "Starter",
                validity: balanceData.validity || "Lifetime",
              },
              endpoint: balanceEndpoint,
            });
          }
        }

        console.log("[v0] All auth methods failed, last error:", lastError);
        console.log(
          "[v0] Balance endpoint failed, returning simulated balance"
        );
        return NextResponse.json({
          success: true,
          balance: {
            credits: 0,
            plan: "Starter",
            validity: "Lifetime",
          },
          simulated: true,
          message: "Balance endpoint failed, showing simulated balance",
        });
      } catch (error: any) {
        console.error("[v0] Balance check error:", error);
        return NextResponse.json({
          success: true,
          balance: {
            credits: 0,
            plan: "Starter",
            validity: "Lifetime",
          },
          simulated: true,
          error: error.message,
        });
      }
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
        hasStyleImage: !!styleImageFile,
      });

      let apiEndpoint: string;
      let requestBody: any;
      let statusEndpoint: string;
      let styleImageUrl: string | undefined;

      if (styleImageFile) {
        console.log("[v0] Uploading style image...");

        const styleUploadResponse = await fetch(
          "https://api.lightxeditor.com/external/api/v2/uploadImageUrl",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({
              uploadType: "imageUrl",
              size: styleImageFile.size,
              contentType: styleImageFile.type,
            }),
          }
        );

        if (styleUploadResponse.ok) {
          const styleUploadData = await styleUploadResponse.json();
          const { uploadImage: styleUploadUrl, imageUrl: finalStyleUrl } =
            styleUploadData.body;

          const stylePutResponse = await fetch(styleUploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": styleImageFile.type,
            },
            body: styleImageFile,
          });

          if (stylePutResponse.ok) {
            styleImageUrl = finalStyleUrl;
            console.log(
              "[v0] Style image uploaded successfully:",
              styleImageUrl
            );
          }
        }
      }

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
          if (!styleImageUrl) {
            return NextResponse.json(
              { error: "Style image is required for virtual try-on" },
              { status: 400 }
            );
          }
          requestBody = {
            imageUrl: imageUrl,
            styleImageUrl: styleImageUrl,
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
              styleImageUrl ||
              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "portrait":
          apiEndpoint = "https://api.lightxeditor.com/external/api/v1/portrait";
          requestBody = {
            imageUrl: imageUrl,
            styleImageUrl: styleImageUrl || "", // Always include, use empty string if not provided
            textPrompt: textPrompt || "professional portrait style",
          };
          statusEndpoint =
            "https://api.lightxeditor.com/external/api/v1/order-status";
          break;

        case "replace":
          apiEndpoint = "https://api.lightxeditor.com/external/api/v1/replace";
          requestBody = {
            imageUrl: imageUrl,
            maskedImageUrl: styleImageUrl || imageUrl,
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

      console.log(
        "[v0] Final request body being sent:",
        JSON.stringify(requestBody, null, 2)
      );
      console.log("[v0] API endpoint:", apiEndpoint);

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

      if (generationData.status === "FAIL" || !generationData.body) {
        console.log(
          "[v0] Generation failed:",
          generationData.message || "Unknown error"
        );
        return NextResponse.json(
          {
            error: generationData.message || "Generation failed",
            details:
              generationData.description || "API returned failure status",
            statusCode: generationData.statusCode,
          },
          { status: 400 }
        );
      }

      const { orderId } = generationData.body;

      console.log("[v0] Starting polling for order:", orderId);

      // Step 4: Poll for result using the appropriate status endpoint
      let retries = 0;
      const maxRetries = 10; // Increased from 5 to 10
      const pollInterval = 5000; // Increased from 3000ms to 5000ms (5 seconds)

      while (retries < maxRetries) {
        console.log(
          `[v0] Polling attempt ${retries + 1}/${maxRetries} for order:`,
          orderId
        );
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

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

            if (statusData.status === "FAIL") {
              console.log(
                "[v0] Generation failed with API error:",
                statusData.message
              );
              return NextResponse.json(
                {
                  error: statusData.message || "Generation failed",
                  details: statusData.description || "API processing failed",
                  statusCode: statusData.statusCode,
                },
                { status: 400 }
              );
            }

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
