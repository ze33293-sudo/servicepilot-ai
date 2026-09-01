import {Composition} from 'remotion';
import {ServicePilotMain, TOTAL_FRAMES} from './servicepilot/Main';

export const Root: React.FC = () => (
  <Composition
    id="ServicePilotDemo"
    component={ServicePilotMain}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
);
