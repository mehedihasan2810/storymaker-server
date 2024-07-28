import { and, arrayOverlaps, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../lib/db/index.js";
import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import puppeteer from "puppeteer";
import { oldTools, tools } from "../lib/db/schema.js";
import { encoding_for_model } from "tiktoken";
import sharp from "sharp";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "dotenv/config";

const s3Client = new S3Client({
  region: process.env.S3_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const MAX_INPUT_TOKEN = 1000; // 1000 will be scraped content's max token  but with system and assistant message total token will be 1520
const MAX_OUTPUT_TOKEN = 1000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // apiKey: process.env.GROQ_API_KEY,
  // baseURL: "https://api.groq.com/openai/v1",
});

const chromiumPack =
  "https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar";

// const chromiumPack =
//   "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar";

// const tags = `AI Detection, Aggregators, Avatar, Chat, Copywriting, Finance, For Fun, Gaming, Generative Art, Generative Code, Generative Video, Image Improvement, Image Scanning, Inspiration, Marketing, Motion  Capture, Music, Podcasting, Productivity, Prompt Guides, Research, Self-Improvement, Social Media, Speech-To-Text, Text-To-Speech, Text-To-Video, Translation, Video Editing, Voice Modulation`;

// const pricing_model = `Free, Premium, GitHub, Google Colab, Open Source, Paid`;

// const PROMPT_COMMON = [
//   {
//     role: "system",
//     content: `You are a helpful assistant who generates a name, title, description, summary, tags, additional tags and pricing model from the given prompt.

//     When given a prompt, you will generate a name, a title, a description, a summary, tags, additional tags and pricing model from the given prompt. The prompt is content of a website.

// To generate the name, title, description, summary, tags, additional tags and pricing model, follow these guidelines:
// - The name should be the name of the website.
// - The title should be concise and captivating, representing the main theme or essence of the content. Also the title should be less than 100 characters. When adding the title to the response, write only the title, do not add any explanation before or after in your response. Do not wrap the title in any punctuation.
// - The description should provide a 1-2 sentence brief overview of the website's content, enticing users to explore further.
// - The summary should provide a brief overview of the website's content, enticing users to explore further. Keep it between 100 to 150 words.
// - The tags should be among these ${tags}. Generate maximum 3 tags.
// - The additional tags should be relevant keywords or phrases that users might search for when looking for similar content. Generate maximum 5 additional tags.
// - The pricing model should be among these words ${pricing_model}. If you can't find the pricing model then return empty string.

// Once you have all this information, return it in a JSON string with the keys: name, title, description, summary, tags, additional_tags, pricing_model. You MUST return valid JSON. Do NOT wrap the json output in \`\`\`json ... \`\`\`!
//       `,
//   },
//   {
//     role: "assistant",
//     content: "What is the content of the website?",
//   },
// ];

// const PROMPT_COMMON = [
//   {
//     role: "system",
//     content: `You are a helpful assistant who generates structured information about a website based on its content. When given a prompt containing website content, you will generate the following information:

// 1. name: The name of the website.
// 2. description: A brief 1-2 sentence overview of the website's content and purpose.
// 3. pricing_model: Choose from: Free, Freemium, Paid, Free Trial, Contact for Pricing, Deals. If uncertain, return an empty string.
// 4. category: A single value that best matches the website's primary purpose.
// 5. categories: An array of up to 3 strings representing the website's categories.
// 6. features: An array of strings, only including the following options: Waitlist, Open Source, Mobile App, API, Discord Community, Browser Extension. Include only the features that apply to the website.
// 7. blog: An HTML string (wrapped in backticks) containing a concise blog post about the website. Include information about its purpose, services, how it can help in daily life, and other important aspects. Keep the blog brief but informative.

// Return this information as a valid JSON string with the keys: name, description, pricing_model, category, categories, features, blog. Do NOT wrap the JSON output in \`\`\`json ... \`\`\`!`,
//   },
//   {
//     role: "assistant",
//     content:
//       "Please provide the content of the website you'd like me to analyze.",
//   },
// ];

// 2. description: A brief 1-2 sentence overview of the website's content and purpose.

// System and assistant token size is 520
const PROMPT_COMMON = [
  {
    role: "system",
    content: `You are a helpful assistant who generates structured information about a website based on its content. When given a prompt containing website content, you will generate the following information:

1. name: The name of the website.
2. title: The title should be concise and captivating, representing the main theme or essence of the content. Also the title should be less than 100 characters. When adding the title to the response, write only the title, do not add any explanation before or after in your response. Do not wrap the title in any punctuation.
3. pricingModel: Choose from: Free, Freemium, Paid, Free Trial, Contact for Pricing, Deals. If uncertain, return an empty string.
4. category: A single value that best matches the website's primary purpose.
5. categories: An array of up to 3 strings representing the website's categories.
6. features: An array of strings, only including the following options: Waitlist, Open Source, Mobile App, API, Discord Community, Browser Extension. Include only the features that apply to the website.
7. blog: An HTML string containing an informative blog post about the website. The blog should have the following structure:
   - Main title (h1)
   - Cover image: Use this URL: https://galaxywayai.s3.eu-west-2.amazonaws.com/images/ai-tool/web-image/Sequens.ai-1721308938537-jpeg
   - Short description (p)
   - Multiple sections, each with:
     - Section title (h2)
     - Section content (p)
   - Use unordered lists (ul) and list items (li) where appropriate to present information clearly
   - The blog should comprehensively cover:
     - The website's purpose
     - Key features and services
     - How it can benefit users in their daily lives
     - Any unique selling points or innovations
     - Target audience
     - How to get started or use the service

Ensure the blog is informative, engaging, and provides a complete overview of the website while remaining concise. Use clear, professional language and organize the information logically.

Return this information as a valid JSON string with the keys: name, title, pricingModel, category, categories, features, blog. Do NOT wrap the JSON output in \`\`\`json ... \`\`\`!`,
  },
  {
    role: "assistant",
    content:
      "Please provide the content of the website you'd like me to analyze.",
  },
];

export const toolResolver = {
  Query: {
    async tools() {
      const toolsRes = await db.select().from(tools);

      console.log({ toolsRes });

      return toolsRes;
    },

    async publishedTools() {
      const publishedToolsRes = await db
        .select()
        .from(tools)
        .where(eq(tools.status, "published"));

      console.log({ publishedToolsRes });

      return publishedToolsRes;
    },

    async tool(_, { id }) {
      console.log({ id });

      const toolRes = await db
        .select()
        .from(tools)
        .where(eq(tools.id, id))
        .then((res) => res[0]);

      // console.log({ toolRes });

      return toolRes;
    },

    async oldTools() {
      const toolsRes = await db.select().from(oldTools);

      console.log({ toolsRes });

      return toolsRes;
    },

    async publishedOldTools(_, { limit }) {
      console.log({ limit });

      const publishedToolsRes = await db
        .select()
        .from(oldTools)
        .where(eq(oldTools.status, "published"))
        .limit(limit);

      console.log({ publishedToolsRes: publishedToolsRes.length });

      return publishedToolsRes;
    },

    async oldTool(_, { id }) {
      console.log({ id });

      const toolRes = await db
        .select()
        .from(oldTools)
        .where(eq(oldTools.id, id))
        .then((res) => res[0]);

      console.log({ toolRes });

      return toolRes;
    },

    async searchTools(_, { query, pricing, categories, sortBy }) {
      console.log({ query, pricing, categories, sortBy });

      const trimmedQuery = query.trim();
      const isPricing = pricing && pricing.length > 0;
      const isCategory = categories && categories.length > 0;

      let baseQuery = db
        .select()
        .from(oldTools)
        .where(eq(oldTools.status, "published"));
      const conditions = [];

      if (trimmedQuery) {
        conditions.push(
          or(
            ilike(oldTools.name, `%${trimmedQuery}%`),
            ilike(oldTools.title, `%${trimmedQuery}%`)
          )
        );
      }

      if (isPricing) {
        conditions.push(ilike(oldTools.pricingModel, pricing.join(",")));
      }

      if (isCategory) {
        conditions.push(arrayOverlaps(oldTools.tags, categories));
      }
      // arrayOverlaps

      if (conditions.length > 0) {
        baseQuery = baseQuery.where(and(...conditions));
      }

      baseQuery = baseQuery.orderBy(
        sortBy === "newest" ? desc(oldTools.createdAt) : asc(oldTools.createdAt)
      );

      // let searchRes;
      // if (isPricing || isCategory || trimmedQuery !== "") {
      //   console.log("query");
      //   searchRes = await db
      //     .select()
      //     .from(oldTools)
      //     .where(
      //       and(
      //         or(
      //           isPricing
      //             ? ilike(oldTools.pricingModel, pricing.join(","))
      //             : // ? arrayContains(oldTools.pricingModel, pricing)
      //               undefined,
      //           isCategory
      //             ? arrayContains(oldTools.tags, categories)
      //             : undefined,
      //           trimmedQuery
      //             ? or(
      //                 ilike(oldTools.name, `%${trimmedQuery}%`),
      //                 ilike(oldTools.title, `%${trimmedQuery}%`)
      //               )
      //             : undefined
      //         ),
      //         eq(oldTools.status, "published")
      //       )
      //     )
      //     .orderBy(
      //       sortBy === "newest"
      //         ? desc(oldTools.createdAt)
      //         : asc(oldTools.createdAt)
      //     );
      // } else {
      //   console.log("all");
      //   searchRes = await db
      //     .select()
      //     .from(oldTools)
      //     .where(eq(oldTools.status, "published"))
      //     .orderBy(
      //       sortBy === "newest"
      //         ? desc(oldTools.createdAt)
      //         : asc(oldTools.createdAt)
      //     );
      // }

      // const res = await searchRes;

      return baseQuery.execute();
    },

    async heroSearchTools(_, { query }) {
      console.log({ query });

      if (query.trim() === "") return [];

      const searchRes = await db
        .select()
        .from(oldTools)
        .where(
          and(
            or(
              ilike(oldTools.name, `%${query}%`),
              ilike(oldTools.title, `%${query}%`)
            ),
            eq(oldTools.status, "published")
          )
        );

      console.log({ searchRes: searchRes.length });

      return searchRes;
    },

    async signedUrl(_, { signedUrlInput: files }, _context, _info) {
      // console.log({ files });

      const urls = {};

      for (const file of files) {
        const toolWebImageKey =
          file.keyName === "imageFile"
            ? `images/ai-tool/web-image/${file.fileName}-${Date.now()}-${
                file.fileType.split("/")[1]
              }`
            : `images/ai-tool/logo/${file.fileName}-${Date.now()}-${
                file.fileType.split("/")[1]
              }`;

        const putObjectCommand = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: toolWebImageKey,
          // Key: generateFileName2(fileName, file.fileType.split("/")[1]),
          ContentType: file.fileType,
          ContentLength: file.fileSize,
          ChecksumSHA256: file.checksum,
          // Let's also add some metadata which is stored in s3.
          //  Metadata: {
          //   userId: session.user.id
          // },
        });

        const url = await getSignedUrl(
          s3Client,
          putObjectCommand,
          { expiresIn: 60 * 5 } // 5 minutes
        );
        urls[file.keyName] = url;
      }

      // console.log({ urls });

      return urls;
    },
  },

  Mutation: {
    async createTool(_, { tool }) {
      console.log({ tool });

      const createdToolRes = await db
        .insert(tools)
        .values(tool)
        .returning()
        .then((res) => res[0]);

      console.log({ createdToolRes });

      return createdToolRes;
    },

    async updateTool(_, { tool }) {
      console.log({ tool });

      const { id, ...input } = tool;

      const updatedToolRes = await db
        .update(tools)
        .set(input)
        .where(eq(tools.id, id))
        .returning()
        .then((res) => res[0]);

      console.log({ updatedToolRes });

      return updatedToolRes;
    },

    async deleteTool(_, { id, logoUrl, imageUrl }) {
      console.log({ id, logoUrl, imageUrl });
      const result = await Promise.all(
        [logoUrl, imageUrl].map(async (url) => {
          if (url) {
            // const key = url.replace(
            //   "https://galaxywayai.s3.eu-west-2.amazonaws.com/",
            //   ""
            // );

            const key = url.split(".com/").slice(-1)[0];

            console.log({ key });

            const deleteParams = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: key,
            };

            await s3Client.send(new DeleteObjectCommand(deleteParams));
          }
        })
      );

      console.log({ result });

      const deletedToolRes = await db
        .delete(tools)
        .where(eq(tools.id, id))
        .returning()
        .then((res) => res[0]);

      console.log({ deletedToolRes });

      return deletedToolRes;
    },

    async updateStatus(_, { statusInput }) {
      console.log({ statusInput });

      const updatedStatusRes = await db
        .update(tools)
        .set({ status: statusInput.status })
        .where(eq(tools.id, statusInput.id))
        .returning()
        .then((res) => res[0]);

      console.log({ updatedStatusRes });

      return updatedStatusRes;
    },

    async generateTool(_, { url }) {
      const wholeApiStart = Date.now();
      console.log({ url });

      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        console.error("OpenAI API key is not set in environment variables.");
        return {
          data: null,
          error: `OpenAI API key is not set in environment variables.`,
        };
      }

      let { textContent, ssBuffer, scrapedToolLogoBuffer } =
        await scrapeWebsite(url);

      const encoding = encoding_for_model("gpt-4");
      let inputTokens = await countTokens(textContent, encoding);

      console.log(`input token1: ${inputTokens}`);

      if (inputTokens > MAX_INPUT_TOKEN) {
        const trimmedContent = await trimContent(
          textContent,
          MAX_INPUT_TOKEN,
          encoding
        );

        textContent = new TextDecoder().decode(trimmedContent);

        inputTokens = await countTokens(textContent, encoding); // Recount after trimming
      }

      console.log(`Input Tokens222: ${inputTokens}`);

      console.log({ textContent });

      const {
        name,
        title,
        pricingModel,
        category,
        categories,
        features,
        blog,
      } = await generateToolData(textContent);

      const { toolLogoImageUrl, toolWebImageUrl } = await uploadToolFiles(
        ssBuffer,
        scrapedToolLogoBuffer,
        name
      );

      const toolRes = await db
        .insert(tools)
        .values({
          name,
          title,
          url,
          logo: toolLogoImageUrl,
          image: toolWebImageUrl,
          pricingModel,
          category,
          categories,
          features,
          blog,
          label: "New",
          status: "draft",
        })
        .returning()
        .then((res) => res[0]);

      console.log({ toolRes });

      const wholeApiEnd = Date.now();
      console.log(`API TOOK ${wholeApiEnd - wholeApiStart} ms to complete`);

      return toolRes;
    },

    async deleteFile(_, { deleteFileInput: url }, _context) {
      console.log({ url });
      console.log("DELETE FILE STARTED");

      const key = url.split(".com/").slice(-1)[0];

      // console.log({ key, url });

      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      };

      console.log({ deleteParams });

      await s3Client.send(new DeleteObjectCommand(deleteParams));
      console.log("DELETE FILE ENDED");
      return { data: "Successfully deleted the file", error: null };
    },
  },
};

async function countTokens(text, encoding) {
  return encoding.encode(text).length;
}

async function trimContent(content, maxTokens, encoding) {
  const encoded = encoding.encode(content);
  if (encoded.length > maxTokens) {
    const trimmed = encoded.slice(0, maxTokens);

    return encoding.decode(trimmed);
  }
  return content;
}

async function scrapeWebsite(url) {
  const scrapingStart = Date.now();
  console.log("SCRAPING START");

  const isProduction = process.env.NODE_ENV === "production";

  console.log({ isProduction });

  const chromiumArgs = isProduction
    ? chromium.args
    : [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ];

  const executablePath = isProduction
    ? await chromium.executablePath(chromiumPack)
    : puppeteer.executablePath();

  const browser = await puppeteerCore.launch({
    args: chromiumArgs,
    executablePath: executablePath,
    headless: true,
    // ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  // Navigate to the URL
  await page.goto(url);

  let [textContent, scrapedToolLogoUrl, ssBuffer] = await Promise.all([
    page.evaluate(() => {
      const extractTextContent = (element) => {
        if (element.nodeType === Node.TEXT_NODE) {
          return element.textContent.trim();
        }
        if (element.nodeType !== Node.ELEMENT_NODE) {
          return "";
        }
        if (
          element.tagName === "SCRIPT" ||
          element.tagName === "STYLE" ||
          element.tagName === "NOSCRIPT"
        ) {
          return "";
        }
        let text = "";
        for (let child of element.childNodes) {
          text += extractTextContent(child) + " ";
        }
        return text.trim();
      };

      const title = document.querySelector("title")?.textContent?.trim() || "";
      const description =
        document
          .querySelector("meta[name='description']")
          ?.getAttribute("content")
          ?.trim() || "";
      const bodyText = extractTextContent(document.body);

      return [title, description, bodyText].filter(Boolean).join("\n\n");
    }),

    page.evaluate(() => {
      const faviconLink =
        document.querySelector("link[rel~='icon']") ||
        document.querySelector("link[rel='shortcut icon']");
      return faviconLink ? faviconLink.href : null;
    }),

    page.screenshot({
      // path: `./scrapingbee_homepage-${Date.now()}.webp`,
      type: "webp",
    }),
  ]);

  console.log("BUFFER START");
  console.log({ ssBuffer });
  console.log("BUFFER END");

  console.log({ scrapedToolLogoUrl });

  let scrapedToolLogoBuffer;
  if (scrapedToolLogoUrl) {
    const faviconResponse = await page.goto(scrapedToolLogoUrl);
    scrapedToolLogoBuffer = await faviconResponse.buffer();

    // console.log({ scrapedToolLogoBuffer });
  }

  console.log({ scrapedToolLogoBuffer });

  await browser.close();

  const scrapingEnd = Date.now();
  console.log(`SCRAPING END. ${scrapingEnd - scrapingStart} ms`);

  return { textContent, ssBuffer, scrapedToolLogoBuffer };
}

async function generateToolData(textContent) {
  const openaiStart = Date.now();
  console.log("OPENAI GENERATION START");

  const completion = await openai.chat.completions.create({
    response_format: { type: "json_object" },
    messages: [
      ...PROMPT_COMMON,
      {
        role: "user",
        content: textContent,
      },
    ],
    model: "gpt-4o",
    max_tokens: MAX_OUTPUT_TOKEN,
    // model: "Llama3-70b-8192",
    // Send the user ID through per OpenAI's best practices
    // for safety: https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids
    user: nanoid(),
  });

  const generatedContent = completion.choices[0].message.content;

  // const openaiResponse = await axios.post(
  //   "https://api.openai.com/v1/chat/completions",
  //   {
  //     model: "gpt-4o",
  //     // model: "gpt-4-1106-preview",
  //     response_format: { type: "json_object" },
  //     // model: "gpt-4",
  //     messages: [
  //       ...PROMPT_COMMON,
  //       {
  //         role: "user",
  //         content:
  //           textContent.length > MAX_TOKEN
  //             ? textContent.slice(0, MAX_TOKEN)
  //             : textContent,
  //       },
  //     ],
  //     user: nanoid(),
  //   },
  //   {
  //     headers: {
  //       Authorization: `Bearer ${openaiApiKey}`,
  //       "Content-Type": "application/json",
  //     },
  //   }
  // );

  // if (openaiResponse.data.error) {
  //   console.log(openaiResponse.data.error);
  // }

  // const r = openaiResponse.data.choices[0].message.content;

  const { name, title, pricingModel, category, categories, features, blog } =
    JSON.parse(generatedContent);

  console.log({
    name,
    title,
    pricingModel,
    category,
    categories,
    features,
    blog,
  });

  const openaiEnd = Date.now();
  console.log(`OPENAI GENERATION END. ${openaiEnd - openaiStart} ms`);

  return {
    name,
    title,
    pricingModel,
    category,
    categories,
    features,
    blog,
  };
}

async function uploadToolFiles(ssBuffer, scrapedToolLogoBuffer, name) {
  const fileUploadStart = Date.now();
  console.log("FILES UPLOAD START");

  const [toolWebImageUrl, toolLogoImageUrl] = await Promise.all([
    (async function uploadToolWebImage() {
      const toolWebImageKey = `images/ai-tool/web-image/${name}-${Date.now()}-webp`;

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: toolWebImageKey,
        Body: ssBuffer,
        ContentType: "image/webp", // Adjust this based on your image type
      };

      const command = new PutObjectCommand(params);
      const response = await s3Client.send(command);

      // const url = `https://${process.env.S3_BUCKET_NAME}.s3.${
      //   process.env.S3_BUCKET_REGION
      // }.amazonaws.com/${encodeURIComponent(toolWebImageKey)}`;
      const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${toolWebImageKey}`;

      console.log({ url });

      console.log("Upload successful ", response);
      return url;
    })(),
    (async function uploadToolLogoImage() {
      if (!scrapedToolLogoBuffer) return null;

      const webpBuffer = await sharp(scrapedToolLogoBuffer)
        .toFormat("webp")
        .toBuffer();

      const toolLogoKey = `images/ai-tool/logo/${name}-${Date.now()}-webp`;

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: toolLogoKey,
        Body: webpBuffer,
        ContentType: "image/webp", // Adjust this based on your image type
      };

      const command = new PutObjectCommand(params);
      const response = await s3Client.send(command);

      // const logoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${
      //   process.env.S3_BUCKET_REGION
      // }.amazonaws.com/${encodeURIComponent(toolLogoKey)}`;
      const logoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${toolLogoKey}`;

      console.log({ logoUrl });

      console.log("Upload successful ", response);
      return logoUrl;
    })(),
  ]);

  console.log({ toolLogoImageUrl, toolWebImageUrl });

  const fileUploadEnd = Date.now();
  console.log(`FILES UPLOAD END. ${fileUploadEnd - fileUploadStart} ms`);

  return { toolLogoImageUrl, toolWebImageUrl };
}
