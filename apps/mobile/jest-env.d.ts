// Make @testing-library/react-native's custom matchers (toHaveStyle, etc.) visible to tsc.
// The matchers are loaded at runtime via setupFilesAfterEnv; this import pulls in their types.
import '@testing-library/react-native/extend-expect';
