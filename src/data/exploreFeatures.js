// Shared feature list for the Explore section - used both by the Explore
// screen's card grid (ExploreClient) and by the left sidebar of every page
// nested under /explore (e.g. /explore/games), which should show this
// Explore-specific nav instead of the main forum sidebar.
import {
  HomeOutline,
  Home,
  BookOutline,
  Book,
  SearchOutline,
  Search,
  MapOutline,
  Map,
  PrintOutline,
  Print,
  HelpCircle,
  GameControllerOutline,
  GameController,
  TrophyOutline,
  Trophy,
  PeopleOutline,
  People,
} from "react-ionicons";

export const EXPLORE_FEATURES = [
  {
    icon: HomeOutline,
    sidebarIcon: Home,
    title: "Trang chủ",
    key: "home",
    href: "/explore",
  },
  {
    icon: BookOutline,
    sidebarIcon: Book,
    title: "Chợ tài liệu",
    key: "study",
    href: "/explore/study-materials",
  },
  {
    icon: SearchOutline,
    sidebarIcon: Search,
    title: "Tra cứu điểm thi",
    key: "grades",
    href: "/lookup/grades",
  },
  {
    icon: MapOutline,
    sidebarIcon: Map,
    title: "Tìm trường ĐH-CĐ",
    key: "universities",
    href: "/explore/universities",
  },
  {
    icon: PrintOutline,
    sidebarIcon: Print,
    title: "In ấn tài liệu",
    key: "print",
    href: "#",
  },
  {
    icon: HelpCircle,
    sidebarIcon: HelpCircle,
    title: "Đố vui",
    key: "quiz",
    href: "/explore/quiz",
  },
  {
    icon: GameControllerOutline,
    sidebarIcon: GameController,
    title: "Game",
    key: "game",
    href: "/explore/games",
  },
  {
    icon: TrophyOutline,
    sidebarIcon: Trophy,
    title: "Xếp hạng thành viên",
    key: "ranking",
    href: "/users/ranking",
  },
  {
    icon: PeopleOutline,
    sidebarIcon: People,
    title: "Xếp hạng lớp",
    key: "class-ranking",
    href: "#",
  },
];
