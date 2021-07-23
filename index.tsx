/* url -- 小程序ScrollView跟video组件进入全屏再退出后会自动返回顶部 */
import Taro, {
  useCallback,
  useDidShow,
  useState,
  useScope,
  usePageScroll
} from "@tarojs/taro";
import { View, Video, Image } from "@tarojs/components";

import { observer } from "@tarojs/mobx";

import styles from "./index.module.less";

const Index = () => {
  // 获取数据列表 ----私有获取分页列表方法
  const {
    noData,
    state,
    noMore,
    list,
    fetchList,
    setList
  } = useGetList([] as any, `接口`, { isDebance: true });

  const onRefresh = useCallback(() => fetchList(1), [fetchList]);
  // 有条件触发刷新
  useDidShow(() => {
    onRefresh;
  });

  // 查询元素大小
  const selectRect = (name: string, scope: any) => {
    return new Promise<Taro.NodesRef.BoundingClientRectCallbackResult>(
      resolve => {
        setTimeout(() => {
          const query = Taro.createSelectorQuery().in(scope);
          query
            .select(name)
            .boundingClientRect(res => {
              resolve(res as Taro.NodesRef.BoundingClientRectCallbackResult);
            })
            .exec();
        }, 0);
      }
    );
  };
  // 视频播放
  const [videoIndex, setVideoIndex] = useState(-1 as any);
  // 播放视频
  const videoPlay = idx => {
    if (videoIndex <= 0) {
      // 没有播放时播放视频
      setVideoIndex(idx);
      const videoContext = Taro.createVideoContext("video" + idx);
      videoContext.play();
    } else {
      // 停止正在播放的视频
      const videoContextPrev = Taro.createVideoContext("video" + videoIndex);
      videoContextPrev.stop();
      // 将点击视频进行播放
      setVideoIndex(idx);
      const videoContextCurrent = Taro.createVideoContext("video" + idx);
      videoContextCurrent.play();
    }
  };
  // 暂停视频
  const stopPlay = idx => {
    const videoContextPre = Taro.createVideoContext("index" + idx);
    videoContextPre.pause();
  };

  const scope = useScope();
  const windowHeight = Taro.getSystemInfoSync().windowHeight; // 可视区域高度
  usePageScroll(() => {
    // eslint-disable-next-line no-undef
    if (videoIndex >= 0 && !isFullscreen) {
      const id = videoIndex;
      selectRect("#item" + id, scope).then(rect => {
        // 我查询的是包裹视频的元素，可根据需求
        const top = rect.top; // 距离顶部高度
        const bottom = rect.bottom;
        const vh = rect.height; // 元素高度
        if (top < 0 || bottom > vh + windowHeight) {
          // 当视频距离顶部为零，测了下，这个为0，视频不可见。
          setVideoIndex(-1);
        }
      });
    }
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const onFullscreenChange = blo => {
    setIsFullscreen(blo);
  };
  return (
    <View className={styles.page}>
      {noData ? (
        <View className={styles.noData}>暂无数据</View>
      ) : (
        <View className={styles.list}>
          {list.map((val: any, idx) => (
            <View id={`item${idx}`} key={val.id}>
              <View className={styles.itemVideoBox}>
                {idx === videoIndex && (
                  <Video
                    className={styles.video}
                    src={val.url}
                    autoplay
                    onPause={event => {
                      event.stopPropagation();
                      stopPlay(idx);
                    }}
                    onFullscreenChange={event => {
                      event.stopPropagation();
                      onFullscreenChange(event.detail.fullScreen);
                    }}
                    id={`video${idx}`}
                  />
                )}
                {idx !== videoIndex && (
                  <View
                    className={styles.posterImgBlock}
                    onClick={event => {
                      event.stopPropagation();
                      videoPlay(idx);
                    }}
                  >
                    <Image
                      src={val.thumb ? val.thumb : "默认封面图"}
                      mode="aspectFill"
                      lazyLoad
                    />

                    <Image
                      className={styles.palyBtn}
                      src={require("./images/play.png")}
                      mode="aspectFill"
                      lazyLoad
                    />
                  </View>
                )}
              </View>
            </View>
          ))}
          {noMore && <View className={styles.noMore}>没有更多了</View>}
        </View>
      )}
    </View>
  );
};
Index.config = {
  navigationBarTitleText: "列表",
  enablePullDownRefresh: true,
  navigationBarBackgroundColor: "#f6f7f8"
};
export default observer(Index);
