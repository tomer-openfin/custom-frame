const setupFrameButtons = () => {
    const win = fin.Window.getCurrentSync();

    const onClose = () => win.close();
    const onMinimize = () => win.minimize();
    const onMaximize = async () => win.getState().then(state => state === 'maximized' ? win.restore() : win.maximize());

    const closeButton = document.getElementById('close-button');
    const minimizeButton = document.getElementById('minimize-button');
    const maximizeButton = document.getElementById('maximize-button');

    closeButton.addEventListener('click', onClose);
    minimizeButton.addEventListener('click', onMinimize);
    maximizeButton.addEventListener('click', onMaximize);
};

const setupLayout = () => {
    fin.Window.getCurrentSync().getOptions().then(({layoutConfig}) => {
        let layoutContainer = document.getElementById('layout-container');
        var layout = fin.Layout.create(layoutConfig, layoutContainer);
        layout.on('tabCreated', onTabCreated);
        layout.init();
    });
};

document.addEventListener('DOMContentLoaded', () => {
    setupFrameButtons();
    setupLayout();
});

const onTabCreated = tab => {
    replaceCloseButton(tab);
    injectPopoutButton(tab); // should be called after the close button was replaced with our own
};

const injectPopoutButton = tab => {
    const popoutButton = buildPopoutButton(tab);
    const titleElem = tab.element[0].getElementsByClassName("lm_title")[0];

    tab.element[0].insertBefore(popoutButton, titleElem.nextSibling);
}

const buildPopoutButton = parentTab => {
    const popoutButton = document.createElement('div');
    popoutButton.className = 'tab-button';
    popoutButton.onclick = () => onPopoutButtonClick(parentTab);

    const popoutIcon = document.createElement('img');
    popoutIcon.className = 'popout-tab-icon';
    popoutIcon.src = './tab-undock.svg';

    popoutButton.appendChild(popoutIcon);
    return popoutButton;
}

const replaceCloseButton = tab => {
    const oldCloseButton = tab.element[0].getElementsByClassName("lm_close_tab")[0];

    const newCloseButton = document.createElement('div');
    newCloseButton.className = 'tab-button';
    newCloseButton.onclick = () => onCloseTabButtonClick(tab);

    const closeIcon = document.createElement('img');
    closeIcon.className = 'close-tab-icon';
    closeIcon.src = './tab-close.svg';

    newCloseButton.appendChild(closeIcon);

    oldCloseButton.parentNode.replaceChild(newCloseButton, oldCloseButton);
}

const onPopoutButtonClick = parentTab => {
    const viewState = parentTab.contentItem.container.getState();

    const layoutConfig = generatePopoutLayoutConfig(viewState);
    parentTab.contentItem.remove();

    fin.Layout.createWindow({layoutConfig});
}

const onCloseTabButtonClick = async tab => {
    tab.contentItem.remove();
    const state = tab.contentItem.container.getState();
    const win = fin.Window.getCurrentSync();
    const identity = { uuid: win.identity.uuid, name: state.name };
    const view = fin.View.wrapSync(identity);
    await view.removeAllListeners();
    await view.destroy().catch(console.error);
}

const generatePopoutLayoutConfig = componentState => {
    return {
        settings: {
            showPopoutIcon: false,
            showMaximiseIcon: false,
            showCloseIcon: false,
            constrainDragToContainer: false
        },
        content: [{
            type: 'stack',
            content:[{
                type: 'component',
                componentName: 'view',
                componentState
            }]
        }]
    };
}
