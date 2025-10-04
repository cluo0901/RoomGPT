import { roomType, themeType } from "./dropdownTypes";

const GENERAL_PROMPT =
  "Photorealistic interior render with practical layout, natural lighting, and cohesive decor. Maintain real-world proportions and believable materials.";

const ROOM_PROMPTS: Record<roomType, string> = {
  "Living Room":
    "Focus on a comfortable living room arrangement with inviting seating, layered lighting, and balanced focal points.",
  "Dining Room":
    "Highlight a welcoming dining space with a functional table setup, complementary chairs, and ambient lighting.",
  Bedroom:
    "Present a relaxing bedroom retreat with a well-dressed bed, soft textures, and calming lighting accents.",
  Bathroom:
    "Showcase a spa-like bathroom with clean lines, premium fixtures, and organized storage.",
  Office:
    "Design a productive home office with ergonomic furniture, organized storage, and technology integration.",
  "Gaming Room":
    "Deliver an immersive gaming room featuring performance hardware, ambient RGB lighting, and comfortable seating zones.",
};

const THEME_PROMPTS: Record<themeType, string> = {
  Modern:
    "Apply contemporary styling with sleek lines, neutral foundations, and high-contrast accents.",
  Vintage:
    "Incorporate nostalgic elements, warm palettes, and characterful furnishings inspired by mid-century interiors.",
  Minimalist:
    "Simplify the space with clean silhouettes, negative space, and a restrained color palette.",
  Professional:
    "Emphasize sophisticated finishes, tailored furniture choices, and a composed, executive mood.",
  Tropical:
    "Introduce breezy textures, botanical accents, and sunlit warmth reminiscent of coastal escapes.",
};

const DEFAULT_ROOM: roomType = "Living Room";
const DEFAULT_THEME: themeType = "Modern";

export function buildPrompt(roomInput: string, themeInput: string): string {
  const room = (Object.keys(ROOM_PROMPTS) as roomType[]).includes(
    roomInput as roomType
  )
    ? (roomInput as roomType)
    : DEFAULT_ROOM;

  const theme = (Object.keys(THEME_PROMPTS) as themeType[]).includes(
    themeInput as themeType
  )
    ? (themeInput as themeType)
    : DEFAULT_THEME;

  const roomDetails = ROOM_PROMPTS[room];
  const themeDetails = THEME_PROMPTS[theme];

  return `${GENERAL_PROMPT} ${roomDetails} ${themeDetails}`;
}
