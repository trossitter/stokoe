// TODO: hook this up to the team-trained hand/pose model once the dataset
// and training pipeline land. Spec forbids pretrained landmark detectors,
// so this will wrap our own model (likely a small CNN or MLP over frame
// crops, or a from-scratch keypoint regressor). Returning null keeps the
// UI compilable while the model is in flight.
export function useHandTracker(): null {
  return null;
}
