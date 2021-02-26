import {DisabledPanelCpu} from "./disabledPanelCpu";
import {EditUserProfilePanel} from "./editUserProfilePanel";

/** Make ViewUserProfilePanel base on EditUserProfilePanel with DisabledPanelCpu */
export const ViewUserProfilePanel = DisabledPanelCpu.process(EditUserProfilePanel);