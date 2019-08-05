// @flow
import * as React from 'react';
import {
  Dimensions, StyleSheet, View,
} from 'react-native';
import {
  Video, Constants,
} from 'expo';

import Animated from 'react-native-reanimated';

import { PanGestureHandler, State } from 'react-native-gesture-handler';

import { type Video as VideoModel } from './videos';
import VideoContent from './VideoContent';
import PlayerControls, { PLACEHOLDER_WIDTH } from './PlayerControls';

const {
  add,
  multiply,
  neq,
  spring,
  cond,
  eq,
  event,
  lessThan,
  greaterThan,
  and,
  call,
  set,
  clockRunning,
  startClock,
  stopClock,
  Clock,
  Value,
  concat,
  interpolate,
  Extrapolate,
} = Animated;

const { width, height } = Dimensions.get('window');
const { statusBarHeight } = Constants;
const midBound = height - 3 * 64;
const minHeight = 64;
const upperBound = midBound + minHeight;
const AnimatedVideo = Animated.createAnimatedComponent(Video);
const shadow = {
  alignItems: 'center',
  elevation: 1,
  shadowColor: 'black',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.18,
  shadowRadius: 2,
};

function runSpring(clock, value, dest) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  };

  const config = {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restSpeedThreshold: 1,
    restDisplacementThreshold: 0.5,
    toValue: new Value(0),
  };

  return [
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.velocity, 0),
      set(state.position, value),
      set(config.toValue, dest),
      startClock(clock),
    ]),
    spring(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position,
  ];
}


type VideoModalProps = {
  video: VideoModel,
};

export default class VideoModal extends React.PureComponent<VideoModalProps> {
  onGestureEvent: $Call<event>

  translationY = new Value(0);

  velocityY = new Value(0);

  offsetY = new Value(0);

  gestureState = new Value(State.UNDETERMINED);

  translateY: Value;

  constructor(props: VideoModalProps) {
    super(props);
    const {
      translationY, velocityY, offsetY, gestureState: state,
    } = this;
    this.onGestureEvent = event([
      {
        nativeEvent: {
          translationY,
          velocityY,
          state,
        },
      },
    ], { useNativeDriver: true });
    const clockY = new Clock();
    const finalTranslateY = add(translationY, multiply(0.2, velocityY));
    const translationThreshold = height / 2;

    const snapPoint = cond(
      lessThan(finalTranslateY, translationThreshold),
      0,
      upperBound,
    );
    this.translateY = cond(
      eq(state, State.END),
      [
        set(translationY, runSpring(clockY, add(offsetY, translationY), snapPoint)),
        set(offsetY, translationY),
        translationY,
      ],
      [
        cond(eq(state, State.BEGAN), stopClock(clockY)),
        add(offsetY, translationY),
      ],
    );
  }

  render() {
    const { onGestureEvent, translateY: tY } = this;
    const { video } = this.props;
    const translateY = interpolate(
      tY, {
        inputRange: [0, midBound],
        outputRange: [0, midBound],
      },
    );
    const videoContainerWidth = interpolate(tY, {
      inputRange: [0, midBound],
      outputRange: [width, width - 16],
      extrapolate: Extrapolate.CLAMP,
    });
    const videoWidth = interpolate(translateY, {
      inputRange: [0, midBound, upperBound],
      outputRange: [width, width - 16, PLACEHOLDER_WIDTH],
      extrapolate: Extrapolate.CLAMP,
    });
    const videoHeight = interpolate(tY, {
      inputRange: [0, midBound],
      outputRange: [width / 1.78, minHeight],
      extrapolate: Extrapolate.CLAMP,
    });
    const contentOpacity = interpolate(tY, {
      inputRange: [0, upperBound / 1.2],
      outputRange: [1, 0],
      extrapolate: Extrapolate.CLAMP,
    });
    const playerControlOpacity = interpolate(tY, {
      inputRange: [midBound, upperBound],
      outputRange: [0, 1],
      extrapolate: Extrapolate.CLAMP,
    });
    const contentWidth = interpolate(tY, {
      inputRange: [0, midBound],
      outputRange: [width, width - 16],
      extrapolate: Extrapolate.CLAMP,
    });
    const contentHeight = interpolate(tY, {
      inputRange: [0, midBound],
      outputRange: [height, 0],
      extrapolate: Extrapolate.CLAMP,
    });
    return (
      <>
        <View
          style={{
            height: statusBarHeight,
            backgroundColor: 'black',
          }}
        />
        <PanGestureHandler
          onHandlerStateChange={onGestureEvent}
          {...{ onGestureEvent }}
        >
          <Animated.View
            style={{
              transform: [{ translateY }],
              ...shadow,
            }}
          >
            <Animated.View style={{ backgroundColor: 'white', width: videoContainerWidth }}>
              <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: playerControlOpacity }}>
                <PlayerControls title={video.title} onPress={() => true} />
              </Animated.View>
              <AnimatedVideo
                source={video.video}
                style={{ width: videoWidth, height: videoHeight }}
                resizeMode={Video.RESIZE_MODE_COVER}
                shouldPlay
              />
            </Animated.View>
            <Animated.View style={{ backgroundColor: 'white', width: contentWidth, height: contentHeight }}>
              <Animated.View style={{ opacity: contentOpacity }}>
                <VideoContent {...{ video }} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>
      </>
    );
  }
}
