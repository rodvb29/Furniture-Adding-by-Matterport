import React, { Component } from 'react';
import { SceneView } from './SceneView';
import { SceneNodeView } from './SceneNodeView';
import { FrameView } from './Frame';
import { Selection, TransformToolbar } from './TransformToolbar';
import { SceneDropZone } from './SceneDropZone';
import {
  ISceneNode,
  IComponentEventSpy,
  IInteractionEvent,
  ComponentInteractionType,
  IVector3,
  IVector2,
} from '@mp/common';
import { WithStyles, withStyles } from '@material-ui/core/styles';
import { Grid, Button } from '@material-ui/core';
import { Vector3 } from 'three';
import { MenuView, IMenuItem } from './MenuView';
import { IContext, IDialogUser } from '../interfaces';
import { AppContext } from '../AppContext';
import { ISubscription } from '@mp/common';
import { CameraView } from './CameraView';
import { Menus, MenuItemDescriptor, MenuDescriptor } from './Menus';
import { saveStringToFile } from '../utils';

export const waitUntil = async (condition: () => boolean) => {
  return new Promise(function (resolve, reject) {
    let intervalId: number;
    const checkCondition = () => {
      if (condition()) {
        clearInterval(intervalId);
        resolve();
      }
    };
    intervalId = window.setInterval(checkCondition, 30);
  });
};

const styles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    height: 'calc(100vh - 36px)',
  },
  root: {
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: 'white',
    height: 48,
    width: '200px',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexGrow: 1,
    padding: '8px',
    height: 'calc(100vh - 132px)',
  },
  toolbar: {
    display: 'flex',
    width: '100vw',
    height: '80px',
  },
  button: {
    height: '48px',
    paddingTop: '10px',
    margin: '12px',
  },
  dropdown: {
    height: '36px',
  },
});

interface Props extends WithStyles<typeof styles> {}

<<<<<<< HEAD
  const urlParams = new URLSearchParams(window.location.search);
  let modelSid = 'jV7eHHchMK9';
  if (urlParams.has('m')) {
    modelSid = urlParams.get('m');
  }
=======
interface State {
  scene: ISceneNode[];
  cameraPosition: IVector3;
  cameraRotation: IVector2;
  selection: ISceneNode;
  user: IDialogUser | null;
}
>>>>>>> 035ca9de3c727304060495debdeb8e530fa489f3

class MainViewImpl extends Component<Props, State> {
  context: IContext;
  static contextType = AppContext;
  private modelSid: string = null;
  private spySubs: ISubscription[] = [];

  constructor(props: Props) {
    super(props);

    this.state = {
      scene: [],
      selection: null,
      user: null,
      cameraPosition: { x: 0, y: 0, z: 0 },
      cameraRotation: { x: 0, y: 0 },
    };

    const urlParams = new URLSearchParams(window.location.search);
    this.modelSid = 'j4RZx7ZGM6T';
    if (urlParams.has('m')) {
      this.modelSid = urlParams.get('m');
    }

    this.itemSelected = this.itemSelected.bind(this);
    this.itemDoubleClick = this.itemDoubleClick.bind(this);
    this.itemDeleted = this.itemDeleted.bind(this);
    this.transformSelected = this.transformSelected.bind(this);
    this.dropped = this.dropped.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  private itemSelected(item: ISceneNode|null) {
    const widget = this.context.scene.widget;
    const cameraInput = this.context.scene.cameraInput;

    if (item === null) {
      this.setState({
        selection: null,
      });
      widget.inputs.selection = null;
      cameraInput.inputs.focus = null;
    } else {
      this.setState({
        selection: item,
      });
      if (widget) {
        widget.inputs.selection = item;
      }
    }
  }

  private itemDoubleClick(item: ISceneNode) {
    const widget = this.context.scene.widget;
    const cameraInput = this.context.scene.cameraInput;

    this.setState({
      selection: item,
    });
    if (widget) {
      widget.inputs.selection = item;
    }
    cameraInput.inputs.focus = new Vector3().copy((item as any).obj3D.position);
  }

  private itemDeleted(item: ISceneNode) {
    this.setState({
      selection: null,
    });
    this.context.scene.widget.inputs.selection = null;
    this.context.scene.cameraInput.inputs.focus = null;
    this.context.scene.removeObject(item);
    item.stop();
  }

  private transformSelected(selection: Selection) {
    this.context.scene.widget.inputs.mode = selection;
  }

  private async dropped(objects: string) {
    await this.context.scene.deserialize(objects);
  }

  private async onSave() {
    const serialized = await this.context.scene.serialize();
    saveStringToFile(serialized, 'scene.json');
  }

  componentDidMount() {
    // setup the command factories
    for (const menu of Menus) {
      for (const item of menu.items) {
        item.commandFactory = item.factoryMaker(this.context);
      }
    }

    this.context.scene.objects.subscribe({
      next: (v) => {
        // unsubscribe from spy events
        for (const sub of this.spySubs) {
          sub.cancel();
        }
        this.spySubs = [];

        class ClickSpy implements IComponentEventSpy<IInteractionEvent> {
          public eventType = ComponentInteractionType.CLICK;
          constructor(private mainView: MainViewImpl, private node: ISceneNode) {}
          onEvent(payload: IInteractionEvent) {
            this.mainView.itemSelected(this.node);
          }
        }

        // resubscribe to spy events
        // If the current selection isn't in the scene anymore, clear it.
        let selectionInScene = false;
        for (const node of v) {
          if (node === this.state.selection) {
            selectionInScene = true;
          }

          for (const component of node.componentIterator()) {
            const sub = component.spyOnEvent(new ClickSpy(this, node));
            this.spySubs.push(sub);
          }
        }

        if (selectionInScene) {
          this.setState({ scene: v });
        }
        else {
          if (this.context.scene.widget) {
            this.context.scene.widget.inputs.selection = null;
          }
          
          if (this.context.scene.cameraInput) {
            this.context.scene.cameraInput.inputs.focus = null;
          }

          this.setState({
            scene: v,
            selection: null,
          });
        }
      },
    });
  }

  render() {
    const classes = this.props.classes;
    const src = `./bundle/showcase.html?m=${this.modelSid}&play=1&qs=1&sm=2&sr=-2.87,-.04,-3.13&sp=-.09,3.83,-7.53`;

    const topLevelMenus = Menus.map((menu: MenuDescriptor) => {
      const items = menu.items.map((item: MenuItemDescriptor) => {
        const menuItem: IMenuItem = {
          title: item.title,
          command: async () => {
            const command = item.commandFactory([this.state.selection]);

            this.setState({
              user: command.dialogUser(),
            });

            await command.execute();

            this.setState({
              user: null,
            });
          },
        };
        return menuItem;
      });

      return {
        label: menu.label,
        items,
      };
    });

    return (
      <div>
        <div>
          <Grid container justify="flex-start" className={classes.dropdown}>
            {
              // We don't expect to change the menu dynamically so we will use the index as the key.
              topLevelMenus.map((menu, index) => (
                <MenuView key={index} title={menu.label} items={menu.items}></MenuView>
              ))
            }
          </Grid>
          <div className={classes.wrapper}>
            <div className={classes.toolbar}>
              <TransformToolbar selectionChanged={this.transformSelected}></TransformToolbar>
              <SceneDropZone cb={this.dropped}></SceneDropZone>
              <Button onClick={() => this.onSave()} className={classes.button} variant="contained">
                Save Scene
              </Button>
              <CameraView></CameraView>
            </div>
            <div className={classes.container}>
              <SceneView
                scene={this.state.scene}
                onSingleClick={this.itemSelected}
                selectionDeleted={this.itemDeleted}
                onDoubleClick={this.itemDoubleClick}
              ></SceneView>
              <FrameView src={src}></FrameView>
              <SceneNodeView selection={this.state.selection}></SceneNodeView>
            </div>
          </div>
        </div>
        {this.state.user && this.state.user.jsx()}
      </div>
    );
  }
}

export const MainView = withStyles(styles, { withTheme: true })(MainViewImpl);
