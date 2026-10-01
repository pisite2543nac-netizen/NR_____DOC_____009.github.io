export const state = {
  session: null,
  profile: null,
  route: 'dashboard',
  trace: [],
  build: null,
  mobileFiles: [],
};

export function resetState() {
  state.session = null;
  state.profile = null;
  state.route = 'dashboard';
  state.trace = [];
  state.mobileFiles = [];
}
