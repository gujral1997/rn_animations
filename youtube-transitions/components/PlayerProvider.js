// @flow
import * as React from 'react';
import {
  View, StyleSheet, Dimensions, StatusBar, Animated, Easing,
} from 'react-native';

// import { Easing } from 'react-native-reanimated';
import PlayerContext from './PlayerContext';
import VideoModal from './VideoModal';
import { type Video } from './videos';

// const { Animated, Easing } = DangerZone;

const { height } = Dimensions.get('window');

type PlayerProviderProps = {
  children: React.Node,
};

type PlayerProviderState = {
  video: Video | null,
};

export default class PlayerProvider extends React.PureComponent<PlayerProviderProps, PlayerProviderState> {
  state = {
    video: null,
  };

  animation = new Animated.Value(0);


  toggleVideo=() => {
    Animated.timing(this.animation, {
      duration: 300,
      toValue: 1,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }

  setVideo = (video: Video | null) => {
    this.setState({ video }, this.toggleVideo);
  };

  render() {
    const { setVideo, animation } = this;
    const { children } = this.props;
    const { video } = this.state;
    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [-height, 0],
    });
    return (
      <PlayerContext.Provider value={{ video, setVideo }}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <View style={StyleSheet.absoluteFill}>
            {children}
          </View>
          <Animated.View style={{ transform: [{ translateY }] }}>
            {
              video && <VideoModal {...{ video }} />
            }
          </Animated.View>
        </View>
      </PlayerContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
