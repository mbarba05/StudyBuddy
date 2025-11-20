declare module 'react-native-deck-swiper' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  interface SwiperProps {
    cards: any[];
    renderCard: (card: any, index: number) => React.ReactNode;
    onSwipedLeft?: (cardIndex: number) => void;
    onSwipedRight?: (cardIndex: number) => void;
    onSwipedAll?: () => void;
    backgroundColor?: string;
    stackSize?: number;
    stackScale?: number;
    stackSeparation?: number;
    disableTopSwipe?: boolean;
    disableBottomSwipe?: boolean;
    cardVerticalMargin?: number;
    containerStyle?: ViewStyle;
    [key: string]: any;
  }

  export default class Swiper extends Component<SwiperProps> {}
}