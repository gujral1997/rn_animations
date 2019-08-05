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
import PlayerControls from './PlayerControls';

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

  gestureState = new Value(State.UNDETERMINED);

  translateY: Value;

  constructor(props: VideoModalProps) {
    super(props);
    const { translationY, velocityY, gestureState: state } = this;
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
      height,
    );
    this.translateY = cond(
      eq(state, State.END),
      [
        set(translationY, runSpring(clockY, translationY, snapPoint)),
        // set(offsetY, translationY),
        translationY,
      ],
      translationY,
    );
  }

  render() {
    const { onGestureEvent, translateY } = this;
    const { video } = this.props;
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
            <View style={{ backgroundColor: 'white', width }}>
              <View style={{ ...StyleSheet.absoluteFillObject }}>
                <PlayerControls title={video.title} onPress={() => true} />
              </View>
              <Video
                source={video.video}
                style={{ width, height: width / 1.78 }}
                resizeMode={Video.RESIZE_MODE_COVER}
                shouldPlay
              />
            </View>
            <View style={{ backgroundColor: 'white', width, height }}>
              <View>
                <VideoContent {...{ video }} />
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </>
    );
  }
}
