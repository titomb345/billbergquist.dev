import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ArcadePage from './pages/ArcadePage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';
import { MinesweeperRoguelikePage } from './games/minesweeper-roguelike';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
        errorElement: <ErrorPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: 'arcade',
        element: <ArcadePage />,
        errorElement: <ErrorPage />,
      },
      {
        path: 'arcade/descent',
        element: <MinesweeperRoguelikePage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
