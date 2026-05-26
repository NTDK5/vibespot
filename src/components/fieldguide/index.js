/**
 * Field Guide component barrel.
 *
 * Re-exports every component in the library plus a `FG` namespace
 * object so consumers can choose either style:
 *
 *   import { SpotCard, EditorialButton } from 'src/components/fieldguide';
 *   import { FG } from 'src/components/fieldguide'; // <FG.SpotCard ...>
 *
 * Keep this list in alphabetical-ish-by-category order so a new
 * component is easy to slot in without grep-spelunking.
 */

// primitives
export { default as MonoMeta } from './primitives/MonoMeta';
export { default as DisplayTitle } from './primitives/DisplayTitle';
export { default as Dropcap } from './primitives/Dropcap';
export { default as Rule } from './primitives/Rule';
export { default as SheetHandle } from './primitives/SheetHandle';

// chrome
export { default as TopBar } from './chrome/TopBar';
export { default as SectionHead } from './chrome/SectionHead';
export { default as Pill, PillRow } from './chrome/Pill';
export { default as Segmented } from './chrome/Segmented';
export { default as IconSquare } from './chrome/IconSquare';

// form
export { default as EditorialButton } from './form/EditorialButton';
export { default as FloatingLabelInput } from './form/FloatingLabelInput';
export { default as SearchBar } from './form/SearchBar';

// spot system
export { default as DuotoneVibe } from './spot/DuotoneVibe';
export { default as IndexStamp } from './spot/IndexStamp';
export { default as SaveStamp } from './spot/SaveStamp';
export { default as RatingDots } from './spot/RatingDots';
export { default as SpotPhoto } from './spot/SpotPhoto';
export { default as SpotCard } from './spot/SpotCard';
export { default as ChampionCard } from './spot/ChampionCard';
export { default as ReviewRow } from './spot/ReviewRow';

// signature
export { default as PostmarkStamp } from './signature/PostmarkStamp';
export { default as CompassDial } from './signature/CompassDial';
export { default as HourBarChart } from './signature/HourBarChart';
export { default as MiniMap } from './signature/MiniMap';

// state
export { default as EmptyState } from './state/EmptyState';
export { default as LoadingScreen } from './state/LoadingScreen';
export { default as OfflineBanner } from './state/OfflineBanner';
export { default as ErrorScreen } from './state/ErrorScreen';
export { default as SuccessSheet } from './state/SuccessSheet';

// sheets
export {
  default as FilterSheet,
  DEFAULT_FILTERS,
  filtersEqual,
} from './sheets/FilterSheet';
export { default as MapStylePopover } from './sheets/MapStylePopover';
export { default as CollectionMenuSheet } from './sheets/CollectionMenuSheet';
export { default as CollectionPickerSheet } from './sheets/CollectionPickerSheet';

// collection
export { default as MosaicCover } from './collection/MosaicCover';
export { default as CollectionCard } from './collection/CollectionCard';

import MonoMeta from './primitives/MonoMeta';
import DisplayTitle from './primitives/DisplayTitle';
import Dropcap from './primitives/Dropcap';
import Rule from './primitives/Rule';
import SheetHandle from './primitives/SheetHandle';
import TopBar from './chrome/TopBar';
import SectionHead from './chrome/SectionHead';
import Pill, { PillRow } from './chrome/Pill';
import Segmented from './chrome/Segmented';
import IconSquare from './chrome/IconSquare';
import EditorialButton from './form/EditorialButton';
import FloatingLabelInput from './form/FloatingLabelInput';
import SearchBar from './form/SearchBar';
import DuotoneVibe from './spot/DuotoneVibe';
import IndexStamp from './spot/IndexStamp';
import SaveStamp from './spot/SaveStamp';
import RatingDots from './spot/RatingDots';
import SpotPhoto from './spot/SpotPhoto';
import SpotCard from './spot/SpotCard';
import ChampionCard from './spot/ChampionCard';
import ReviewRow from './spot/ReviewRow';
import PostmarkStamp from './signature/PostmarkStamp';
import CompassDial from './signature/CompassDial';
import HourBarChart from './signature/HourBarChart';
import MiniMap from './signature/MiniMap';
import EmptyState from './state/EmptyState';
import LoadingScreen from './state/LoadingScreen';
import OfflineBanner from './state/OfflineBanner';
import ErrorScreen from './state/ErrorScreen';
import SuccessSheet from './state/SuccessSheet';
import FilterSheet from './sheets/FilterSheet';
import MapStylePopover from './sheets/MapStylePopover';
import CollectionMenuSheet from './sheets/CollectionMenuSheet';
import CollectionPickerSheet from './sheets/CollectionPickerSheet';
import MosaicCover from './collection/MosaicCover';
import CollectionCard from './collection/CollectionCard';

export const FG = Object.freeze({
  MonoMeta,
  DisplayTitle,
  Dropcap,
  Rule,
  SheetHandle,
  TopBar,
  SectionHead,
  Pill,
  PillRow,
  Segmented,
  EditorialButton,
  FloatingLabelInput,
  SearchBar,
  DuotoneVibe,
  IndexStamp,
  SaveStamp,
  RatingDots,
  SpotPhoto,
  SpotCard,
  ChampionCard,
  ReviewRow,
  PostmarkStamp,
  CompassDial,
  HourBarChart,
  MiniMap,
  EmptyState,
  LoadingScreen,
  OfflineBanner,
  ErrorScreen,
  SuccessSheet,
  FilterSheet,
  MapStylePopover,
  CollectionMenuSheet,
  CollectionPickerSheet,
  MosaicCover,
  CollectionCard,
  IconSquare,
});

export default FG;
