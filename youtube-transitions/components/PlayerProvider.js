// @flow
import * as React from 'react';
import {
  View, StyleSheet, Dimensions, StatusBar,
} from 'react-native';

import PlayerContext from './PlayerContext';
import VideoModal from './VideoModal';
import { type Video } from './videos';

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

  setVideo = (video: Video | null) => {
    this.setState({ video }, this.toggleVideo);
  };

  render() {
    const { setVideo } = this;
    const { children } = this.props;
    const { video } = this.state;
    return (
      <PlayerContext.Provider value={{ video, setVideo }}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <View style={StyleSheet.absoluteFill}>
            {children}
          </View>
          <View>
            {
              video && <VideoModal {...{ video }} />
            }
          </View>
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
