import { definePlugin } from '@steambrew/client';

export default definePlugin(() => {
	console.log('CSWatch Extension: Frontend plugin initializing...');
	return {
		icon: null,
		title: 'CSWatch',
		content: (): null => null,
	};
});
