const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useDeepEqualEffect, useBinaryState } = require('stremio/common');
const BufferingLoader = require('./BufferingLoader');
const ControlBar = require('./ControlBar');
const SubtitlesPicker = require('./SubtitlesPicker');
const Video = require('./Video');
const usePlayer = require('./usePlayer');
const useSubtitlesSettings = require('./useSubtitlesSettings');
const styles = require('./styles');

const Player = ({ urlParams }) => {
    const player = usePlayer(urlParams);
    const [subtitlesSettings, updateSubtitlesSettings] = useSubtitlesSettings();
    const [subtitlesPickerOpen, , closeSubtitlesPicker, toggleSubtitlesPicker] = useBinaryState(true);
    const [state, setState] = React.useReducer(
        (state, nextState) => ({
            ...state,
            ...nextState
        }),
        {
            paused: null,
            time: null,
            duration: null,
            buffering: null,
            volume: null,
            muted: null,
            subtitlesTracks: [],
            selectedSubtitlesTrackId: null,
            subtitlesSize: null,
            subtitlesDelay: null,
            subtitlesOffset: null,
            subtitlesTextColor: null,
            subtitlesBackgroundColor: null,
            subtitlesOutlineColor: null
        }
    );
    const videoRef = React.useRef(null);
    const dispatch = React.useCallback((args) => {
        if (videoRef.current !== null) {
            videoRef.current.dispatch(args);
        }
    }, []);
    const onImplementationChanged = React.useCallback((manifest) => {
        manifest.props.forEach((propName) => {
            dispatch({ observedPropName: propName });
        });
        dispatch({ propName: 'subtitlesSize', propValue: subtitlesSettings.size });
        dispatch({ propName: 'subtitlesTextColor', propValue: subtitlesSettings.text_color });
        dispatch({ propName: 'subtitlesBackgroundColor', propValue: subtitlesSettings.background_color });
        dispatch({ propName: 'subtitlesOutlineColor', propValue: subtitlesSettings.outline_color });
    }, [subtitlesSettings.size, subtitlesSettings.text_color, subtitlesSettings.background_color, subtitlesSettings.outline_color]);
    const onPropChanged = React.useCallback((propName, propValue) => {
        setState({ [propName]: propValue });
    }, []);
    const onEnded = React.useCallback(() => {
        console.log('ended');
    }, []);
    const onError = React.useCallback((error) => {
        console.error(error);
    }, []);
    const onPlayRequested = React.useCallback(() => {
        dispatch({ propName: 'paused', propValue: false });
    }, []);
    const onPauseRequested = React.useCallback(() => {
        dispatch({ propName: 'paused', propValue: true });
    }, []);
    const onMuteRequested = React.useCallback(() => {
        dispatch({ propName: 'muted', propValue: true });
    }, []);
    const onUnmuteRequested = React.useCallback(() => {
        dispatch({ propName: 'muted', propValue: false });
    }, []);
    const onVolumeChangeRequested = React.useCallback((volume) => {
        dispatch({ propName: 'volume', propValue: volume });
    }, []);
    const onSeekRequested = React.useCallback((time) => {
        dispatch({ propName: 'time', propValue: time });
    }, []);
    const onSubtitlesTrackSelected = React.useCallback((trackId) => {
        dispatch({ propName: 'selectedSubtitlesTrackId', propValue: trackId });
    }, []);
    const onSubtitlesDelayChanged = React.useCallback((delay) => {
        dispatch({ propName: 'subtitlesDelay', propValue: delay });
    }, []);
    const onSubtitlesSizeChanged = React.useCallback((size) => {
        updateSubtitlesSettings({ subtitles_size: size });
    }, []);
    const onSubtitlesOffsetChanged = React.useCallback((offset) => {
        dispatch({ propName: 'subtitlesOffset', propValue: offset });
    }, []);
    const onContainerMouseDown = React.useCallback((event) => {
        if (!event.nativeEvent.subtitlesPickerClosePrevented) {
            closeSubtitlesPicker();
        }
    }, []);
    useDeepEqualEffect(() => {
        if (player.selected === null || player.selected.stream === null) {
            dispatch({ commandName: 'stop' });
        } else {
            dispatch({
                commandName: 'load',
                commandArgs: {
                    stream: player.selected.stream
                }
            });
        }
    }, [player.selected && player.selected.stream]);
    useDeepEqualEffect(() => {
        dispatch({
            commandName: 'addSubtitlesTracks',
            commandArgs: {
                tracks: player.subtitles_resources
                    .filter((subtitles_resource) => subtitles_resource.content.type === 'Ready')
                    .reduce((tracks, subtitles_resource) => {
                        return tracks.concat(subtitles_resource.content.content);
                    }, [])
            }
        });
    }, [player.subtitles_resources]);
    React.useEffect(() => {
        dispatch({ propName: 'subtitlesSize', propValue: subtitlesSettings.size });
    }, [subtitlesSettings.size]);
    React.useEffect(() => {
        dispatch({ propName: 'subtitlesTextColor', propValue: subtitlesSettings.text_color });
    }, [subtitlesSettings.text_color]);
    React.useEffect(() => {
        dispatch({ propName: 'subtitlesBackgroundColor', propValue: subtitlesSettings.background_color });
    }, [subtitlesSettings.background_color]);
    React.useEffect(() => {
        dispatch({ propName: 'subtitlesOutlineColor', propValue: subtitlesSettings.outline_color });
    }, [subtitlesSettings.outline_color]);
    return (
        <div className={styles['player-container']} onMouseDown={onContainerMouseDown}>
            <Video
                ref={videoRef}
                className={styles['layer']}
                onEnded={onEnded}
                onError={onError}
                onPropValue={onPropChanged}
                onPropChanged={onPropChanged}
                onImplementationChanged={onImplementationChanged}
            />
            <div className={styles['layer']} />
            {
                state.buffering ?
                    <BufferingLoader className={styles['layer']} />
                    :
                    null
            }
            <ControlBar
                className={classnames(styles['layer'], styles['control-bar-layer'])}
                paused={state.paused}
                time={state.time}
                duration={state.duration}
                volume={state.volume}
                muted={state.muted}
                subtitlesTracks={state.subtitlesTracks}
                onPlayRequested={onPlayRequested}
                onPauseRequested={onPauseRequested}
                onMuteRequested={onMuteRequested}
                onUnmuteRequested={onUnmuteRequested}
                onVolumeChangeRequested={onVolumeChangeRequested}
                onSeekRequested={onSeekRequested}
                onToggleSubtitlesPicker={toggleSubtitlesPicker}
            />
            {
                subtitlesPickerOpen ?
                    <SubtitlesPicker
                        className={classnames(styles['layer'], styles['menu-layer'])}
                        tracks={state.subtitlesTracks}
                        selectedTrackId={state.selectedSubtitlesTrackId}
                        offset={state.subtitlesOffset}
                        size={state.subtitlesSize}
                        delay={state.subtitlesDelay}
                        textColor={state.subtitlesTextColor}
                        backgroundColor={state.subtitlesBackgroundColor}
                        outlineColor={state.subtitlesOutlineColor}
                        onTrackSelected={onSubtitlesTrackSelected}
                        onDelayChanged={onSubtitlesDelayChanged}
                        onSizeChanged={onSubtitlesSizeChanged}
                        onOffsetChanged={onSubtitlesOffsetChanged}
                    />
                    :
                    null
            }
        </div>
    );
};

Player.propTypes = {
    urlParams: PropTypes.exact({
        stream: PropTypes.string,
        transportUrl: PropTypes.string,
        type: PropTypes.string,
        id: PropTypes.string,
        videoId: PropTypes.string
    })
};

module.exports = Player;
