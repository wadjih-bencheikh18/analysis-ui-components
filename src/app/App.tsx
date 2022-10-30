import { fileCollectionFromWebservice } from 'filelist-utils';
import { useEffect, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  FaMeteor,
  FaBook,
  FaCogs,
  FaTabletAlt,
  FaGlasses,
  FaSave,
} from 'react-icons/fa';
import { KbsProvider, useKbsGlobal } from 'react-kbs';

import { MeasurementExplorer, MeasurementsPanel } from './components';
import {
  AppStateProvider,
  useAppDispatch,
  useAppState,
} from './context/appState';
import { getCurrentMeasurement } from './context/data.helpers';
import { loadFiles } from './context/load';
import { download } from './utils';

import {
  Accordion,
  DropZoneContainer,
  Header,
  RootLayout,
  SplitPane,
  TabItem,
  Tabs,
  Toolbar,
} from '@/components';
import {
  FullScreenProvider,
  useFullscreen,
} from '@/components/context/FullscreenContext';

export default function App() {
  return (
    <KbsProvider>
      <AppStateProvider>
        <FullScreenProvider>
          <DropZoneArea />
        </FullScreenProvider>
      </AppStateProvider>
    </KbsProvider>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button type="button" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  );
}

function DropZoneArea() {
  const dispatch = useAppDispatch();
  const appState = useAppState();
  const measurement = getCurrentMeasurement(appState);
  const filelist = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('filelist');
  }, []);
  const { toggle } = useFullscreen();
  const items: Array<TabItem> = [
    {
      id: '1h',
      title: '1H',
      content:
        'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Autem odit nulla delectus rem et non quis animi molestias pariatur tempora. Corporis consequuntur asperiores odio officia minima fugiat, corrupti hic illum!',
    },
    { id: '13c', title: '13C', content: 'Hello, World! [b]' },
    { id: '1h,1h', title: '1H,1H', content: 'Hello, World! [c]' },
    { id: '1h,13c', title: '1H,13C', content: 'Hello, World! [d]' },
  ];
  function saveHandler(filename = 'file', spaceIndent = 0) {
    const data = JSON.stringify(
      { data: appState.data, view: appState.view },
      (_key, value) =>
        ArrayBuffer.isView(value) ? Array.from(value as any) : value,
      spaceIndent,
    );
    const blob = new Blob([data], { type: 'text/plain' });
    download(blob, `${filename}.ium`);
  }
  useKbsGlobal([
    {
      shortcut: { key: 's', ctrl: true },
      handler() {
        saveHandler();
      },
    },
  ]);
  useEffect(() => {
    async function getData(url: string | null) {
      if (url) {
        const filelist = await fileCollectionFromWebservice(url);
        await loadFiles(filelist, dispatch);
      }
    }
    void getData(filelist);
  }, [dispatch, filelist]);
  return (
    <RootLayout>
      <DropZoneContainer
        onDrop={(files) => {
          void loadFiles(files, dispatch);
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Header>
              <Toolbar orientation="horizontal">
                <Toolbar.Item
                  titleOrientation="horizontal"
                  id="logo"
                  title="Logo"
                >
                  <FaMeteor />
                </Toolbar.Item>
                <Toolbar.Item
                  titleOrientation="horizontal"
                  id="save"
                  title="Save as ium"
                  onClick={() => saveHandler()}
                >
                  <FaSave />
                </Toolbar.Item>
              </Toolbar>
              <Toolbar orientation="horizontal">
                <Toolbar.Item id="a" title="User manual">
                  <FaBook />
                </Toolbar.Item>
                <Toolbar.Item id="b" title="General settings">
                  <FaCogs />
                </Toolbar.Item>
                <Toolbar.Item id="c" title="Full screen" onClick={toggle}>
                  <FaTabletAlt />
                </Toolbar.Item>
              </Toolbar>
            </Header>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
            }}
          >
            <div>
              <Toolbar orientation="vertical">
                <Toolbar.Item id="a" title="Glasses" active>
                  <FaGlasses />
                </Toolbar.Item>
                <Toolbar.Item id="b" title="Open in large mode">
                  <FaTabletAlt />
                </Toolbar.Item>
              </Toolbar>
            </div>
            <div
              style={{
                width: '100%',
                maxHeight: '100%',
              }}
            >
              <SplitPane
                initialSize="400px"
                initialClosed={500}
                controlledSide="end"
              >
                <ErrorBoundary
                  FallbackComponent={ErrorFallback}
                  onReset={() => {
                    // reset the state of your app so the error doesn't happen again
                  }}
                >
                  <div
                    style={{
                      padding: 5,
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {measurement ? (
                      <MeasurementExplorer
                        measurement={measurement}
                        width="100%"
                        height="100%"
                      />
                    ) : (
                      <span>No data, add them with drag and drop</span>
                    )}
                  </div>
                </ErrorBoundary>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    flex: '1 1 0%',
                  }}
                >
                  <Accordion>
                    <Accordion.Item title="Measurement" defaultOpened>
                      <div
                        style={{
                          flex: '1 1 0%',
                          width: '100%',
                        }}
                      >
                        <MeasurementsPanel
                          measurements={appState.data.measurements}
                          onTabSelect={(kind) => {
                            dispatch({
                              type: 'SELECT_MEASUREMENT_KIND',
                              payload: kind,
                            });
                          }}
                          selectedMeasurement={appState.view.currentMeasurement}
                          onMeasurementSelect={({ measurement, kind }) => {
                            dispatch({
                              type: 'SELECT_MEASUREMENT',
                              payload: { id: measurement.id, kind },
                            });
                          }}
                        />
                      </div>
                    </Accordion.Item>
                    <Accordion.Item title="Integral">
                      <div
                        style={{
                          flex: '1 1 0%',
                          width: '100%',
                        }}
                      >
                        <Tabs
                          orientation="horizontal"
                          items={items}
                          opened={items[0]}
                        />
                      </div>
                    </Accordion.Item>
                  </Accordion>
                </div>
              </SplitPane>
            </div>
          </div>
        </div>
      </DropZoneContainer>
    </RootLayout>
  );
}
