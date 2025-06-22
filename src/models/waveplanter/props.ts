export interface WavePlanterProps extends Record<string, number> {
  radius: number;
  amplitude: number;
  density: number;
  depth: number;
  baseDepth: number;
  twistWaves: number;
}

export const MODEL_NAME = "wave";
export const DEFAULT_PROPS: WavePlanterProps = {
  radius: 75,
  amplitude: 0.2,
  density: 0.3,
  depth: 100,
  baseDepth: 50,
  twistWaves: 0.5,
};
