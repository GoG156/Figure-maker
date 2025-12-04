export enum GenerationStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface GeneratedResult {
  imageUrl: string | null;
  text: string | null;
}

export interface FigureConfig {
  heldItem: string;
  style: string;
  boxLabel: string;
  pose: string;
  material: string;
  environment: string;
  lighting: string;
}

export const generatePrompt = (config: FigureConfig): string => {
  const { heldItem, style, boxLabel, pose, material, environment, lighting } = config;
  
  // Base description of the figure
  let prompt = `Using the nano-banana model, turn this image into a ${style} photo of a collectible figure made of ${material}, holding a ${heldItem}, in a ${pose} pose. `;
  
  // Scene and Environment details
  prompt += `The scene is set in a ${environment} with ${lighting} lighting. `;
  
  // Specific placement details ensuring the "toy/collectible" vibe remains
  prompt += `Place the figure on a surface appropriate for the ${environment}. Next to it, place a packing box with rounded corner design and a transparent front window, so that the figure inside is clearly visible. The box should be printed with the figure's original artwork and "${boxLabel}" logo. `;
  
  // Background details
  if (environment.includes('Computer') || environment.includes('Desk')) {
    prompt += `On the computer screen in the background, display the Blender modeling process of the figure.`;
  } else {
    prompt += `The background should match the ${environment} theme, appearing like a high-quality diorama or product showcase.`;
  }

  return prompt;
};