import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = formData.get("action") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey =
      "5f764be75bcf47c4a0e7fcd7298c10a3_76d871a342514cdb9711b35e6f3471d6_andoraitools";

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    if (action === "generate_face") {
      // Step 1: Get upload URL
      console.log(" Requesting upload URL with:", {
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

      console.log("  Upload response status:", uploadResponse.status);
      console.log(
        "  Upload response headers:",
        Object.fromEntries(uploadResponse.headers.entries())
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.log("  Upload error response:", errorText);

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
        "  Upload data received:",
        JSON.stringify(uploadData, null, 2)
      );

      const { uploadImage, imageUrl } = uploadData.body;
      console.log("  Upload image URL:", uploadImage);
      console.log("  Final image URL:", imageUrl);

      if (!uploadImage || !imageUrl) {
        console.log("  Missing required fields in upload response");
        return NextResponse.json(
          {
            error: "Invalid upload response",
            details: { uploadImage: !!uploadImage, imageUrl: !!imageUrl },
          },
          { status: 500 }
        );
      }

      // Step 2: Upload image to the upload URL
      console.log("  Starting image upload to:", uploadImage);
      const putResponse = await fetch(uploadImage, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      console.log("  Image upload response status:", putResponse.status);
      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        console.log("  Image upload error:", errorText);
        return NextResponse.json(
          { error: "Failed to upload image", details: errorText },
          { status: putResponse.status }
        );
      }

      // Step 3: Generate cartoon using the uploaded image URL
      const template = formData.get("template") as string;
      const textPrompt =
        (formData.get("textPrompt") as string) || "cartoon character";

      console.log("  Starting cartoon generation with:", {
        imageUrl,
        template,
        textPrompt,
      });

      const cartoonResponse = await fetch(
        "https://api.lightxeditor.com/external/api/v1/cartoon",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            imageUrl: imageUrl,
            styleImageUrl: template || undefined,
            textPrompt: textPrompt,
          }),
        }
      );

      console.log("  Cartoon response status:", cartoonResponse.status);
      if (!cartoonResponse.ok) {
        const errorText = await cartoonResponse.text();
        console.log("  Cartoon generation error:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText };
        }
        return NextResponse.json(
          { error: "Failed to generate cartoon", details: error },
          { status: cartoonResponse.status }
        );
      }

      const cartoonData = await cartoonResponse.json();
      console.log(
        "  Cartoon data received:",
        JSON.stringify(cartoonData, null, 2)
      );
      const { orderId } = cartoonData.body;

      if (!orderId) {
        console.log("  No orderId in cartoon response");
        return NextResponse.json(
          { error: "No order ID received" },
          { status: 500 }
        );
      }

      console.log("  Starting polling for order:", orderId);

      // Step 4: Poll for result
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

        const statusResponse = await fetch(
          "https://api.lightxeditor.com/external/api/v1/order-status",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
            },
            body: JSON.stringify({
              orderId: orderId,
            }),
          }
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const { status, output } = statusData.body;

          if (status === "active") {
            return NextResponse.json({
              success: true,
              imageUrl: output,
              orderId: orderId,
            });
          } else if (status === "failed") {
            return NextResponse.json(
              { error: "Generation failed" },
              { status: 500 }
            );
          }
        }

        retries++;
      }

      return NextResponse.json(
        { error: "Generation timeout" },
        { status: 408 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("  LightX API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
