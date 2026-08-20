// Touch input layer for TouchPlayer.tsx — no gesture library dependency,
// built on React Native's built-in PanResponder (react-native-gesture-handler
// isn't installed on this project, see CLAUDE.md's dependency table; adding
// it just for two drag zones would be over-engineering for what this needs).
//
// Split-screen convention (standard for mobile FPS/walking-sim controls):
// left half = floating virtual joystick (movement), right half = drag-to-look
// (camera). Renders as an absolute-fill sibling View on top of the Canvas,
// not inside it — R3F's native Canvas doesn't participate in RN's touch
// responder system the way DOM elements do.
import { useRef, useState, type RefObject } from 'react';
import { View, PanResponder, StyleSheet, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';
import type { TouchControlState } from './TouchPlayer';

const JOYSTICK_RADIUS = 50;

interface TouchControlsProps {
  controlState: RefObject<TouchControlState>;
}

/** `topInset` keeps the two full-height touch zones clear of a header bar (back button etc.) drawn on top of this overlay — without it, the joystick/look-pad zones would swallow taps meant for header controls in that region. */
export default function TouchControls({ controlState, topInset = 0 }: TouchControlsProps & { topInset?: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.half, { left: 0, top: topInset }]}>
        <Joystick controlState={controlState} />
      </View>
      <View style={[styles.half, { right: 0, top: topInset }]}>
        <LookPad controlState={controlState} />
      </View>
    </View>
  );
}

function Joystick({ controlState }: TouchControlsProps) {
  const origin = useRef({ x: 0, y: 0 });
  const [visual, setVisual] = useState<{ origin: { x: number; y: number }; knob: { x: number; y: number } } | null>(
    null
  );

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        origin.current = { x: locationX, y: locationY };
        setVisual({ origin: origin.current, knob: { x: 0, y: 0 } });
      },
      onPanResponderMove: (_evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
        let dx = gesture.dx;
        let dy = gesture.dy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > JOYSTICK_RADIUS) {
          dx = (dx / dist) * JOYSTICK_RADIUS;
          dy = (dy / dist) * JOYSTICK_RADIUS;
        }
        setVisual((prev) => (prev ? { ...prev, knob: { x: dx, y: dy } } : prev));
        controlState.current.move = { x: dx / JOYSTICK_RADIUS, y: -dy / JOYSTICK_RADIUS };
      },
      onPanResponderRelease: () => {
        controlState.current.move = { x: 0, y: 0 };
        setVisual(null);
      },
      onPanResponderTerminate: () => {
        controlState.current.move = { x: 0, y: 0 };
        setVisual(null);
      },
    })
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
      {visual && (
        <>
          <View
            pointerEvents="none"
            style={[styles.joystickBase, { left: visual.origin.x - JOYSTICK_RADIUS, top: visual.origin.y - JOYSTICK_RADIUS }]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.joystickKnob,
              { left: visual.origin.x - 18 + visual.knob.x, top: visual.origin.y - 18 + visual.knob.y },
            ]}
          />
        </>
      )}
    </View>
  );
}

function LookPad({ controlState }: TouchControlsProps) {
  const last = useRef({ x: 0, y: 0 });

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        last.current = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { pageX, pageY } = evt.nativeEvent;
        const dx = pageX - last.current.x;
        const dy = pageY - last.current.y;
        last.current = { x: pageX, y: pageY };
        controlState.current.look.dx += dx;
        controlState.current.look.dy += dy;
      },
    })
  ).current;

  return <View style={StyleSheet.absoluteFill} {...responder.panHandlers} />;
}

const styles = StyleSheet.create({
  half: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
  },
  joystickBase: {
    position: 'absolute',
    width: JOYSTICK_RADIUS * 2,
    height: JOYSTICK_RADIUS * 2,
    borderRadius: JOYSTICK_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  joystickKnob: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});
