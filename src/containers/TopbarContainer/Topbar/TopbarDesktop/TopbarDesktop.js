import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom'; // Import withRouter
import { bool, func, object, number, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, intlShape } from '../../../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { propTypes } from '../../../../util/types';
import {
  Avatar,
  InlineTextButton,
  LinkedLogo,
  Menu,
  MenuLabel,
  MenuContent,
  MenuItem,
  NamedLink,
} from '../../../../components';

import TopbarSearchForm from '../TopbarSearchForm/TopbarSearchForm';

import css from './TopbarDesktop.module.css';

const TopbarDesktop = props => {
  const {
    className,
    appConfig,
    currentUser,
    currentPage,
    rootClassName,
    currentUserHasListings,
    notificationCount,
    intl,
    isAuthenticated,
    onLogout,
    onSearchSubmit,
    initialSearchFormValues,
    searchParams,
    location, // Destructure location prop provided by withRouter
  } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const marketplaceName = appConfig.marketplaceName;
  const authenticatedOnClientSide = mounted && isAuthenticated;
  const isAuthenticatedOrJustHydrated = isAuthenticated || !mounted;
  const userRole = currentUser?.attributes?.profile?.publicData?.role;

  const classes = classNames(rootClassName || css.root, className);

  // Determine if the current page is the landing page based on the pathname
  const isLandingPage = location.pathname === '/';

  const search = !isLandingPage ? (
    <TopbarSearchForm
      className={css.searchLink}
      desktopInputRoot={css.topbarSearchWithLeftPadding}
      onSubmit={onSearchSubmit}
      initialValues={initialSearchFormValues}
      appConfig={appConfig}
      searchParams={searchParams}
    />
  ) : null; // Only render TopbarSearchForm if not on landing page

  const notificationDot = notificationCount > 0 ? <div className={css.notificationDot} /> : null;
  const inboxLink = authenticatedOnClientSide ? (
    <NamedLink
      className={css.inboxLink}
      name="InboxPage"
      params={{ tab: currentUserHasListings ? 'sales' : 'orders' }}
    >
      <span className={css.inbox}>
        <FormattedMessage id="TopbarDesktop.inbox" />
        {notificationDot}
      </span>
    </NamedLink>
  ) : null;

  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    return currentPage === page || isAccountSettingsPage ? css.currentPage : null;
  };

  const profileMenu = authenticatedOnClientSide ? (
    <Menu>
      <MenuLabel className={css.profileMenuLabel} isOpenClassName={css.profileMenuIsOpen}>
        <Avatar className={css.avatar} user={currentUser} disableProfileLink />
      </MenuLabel>
      <MenuContent className={css.profileMenuContent}>
        {userRole !== 'customer' && (
          <MenuItem key="ManageListingsPage">
            <NamedLink
              className={classNames(css.yourListingsLink, currentPageClass('ManageListingsPage'))}
              name="ManageListingsPage"
            >
              <span className={css.menuItemBorder} />
              <FormattedMessage id="TopbarDesktop.yourListingsLink" />
            </NamedLink>
          </MenuItem>
        )}
        {userRole !== 'customer' && (
          <MenuItem key="CMSPage">
            <NamedLink
              className={classNames(css.OverviewLink, currentPageClass('CMSPage'))}
              name="CMSPage"
              params={{ pageId: 'overview' }}
            >
              <span className={css.menuItemBorder} />
              Overview
            </NamedLink>
          </MenuItem>
        )}
        <MenuItem key="ProfileSettingsPage">
          <NamedLink
            className={classNames(css.profileSettingsLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.profileSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="AccountSettingsPage">
          <NamedLink
            className={classNames(css.yourListingsLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.accountSettingsLink" />
          </NamedLink>
        </MenuItem>
        <MenuItem key="logout">
          <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarDesktop.logout" />
          </InlineTextButton>
        </MenuItem>
      </MenuContent>
    </Menu>
  ) : null;

  const signupLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="SignupPage" className={css.signupLink}>
      <span className={css.signup}>
        <FormattedMessage id="TopbarDesktop.signup" />
      </span>
    </NamedLink>
  );

  const loginLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="LoginPage" className={css.loginLink}>
      <span className={css.login}>
        <FormattedMessage id="TopbarDesktop.login" />
      </span>
    </NamedLink>
  );

  const signupBusinessLink = isAuthenticatedOrJustHydrated ? null : (
    <NamedLink name="bSignupPage" className={css.loginLink}>
      <span className={css.login}>Business</span>
    </NamedLink>
  );

  return (
    <nav className={classes}>
      {isLandingPage ? (
        <>
          <div className={css.leftContent}></div>
          <div className={css.logoContainer}>
            <LinkedLogo
              className={css.logoLink}
              layout="desktop"
              logoSettings={{ format: 'image', height: 60 }}
              alt={intl.formatMessage({ id: 'TopbarDesktop.logo' }, { marketplaceName })}
            />
          </div>
          <div className={css.rightContent}>
            {search}
            {userRole === 'author' && (
              <NamedLink className={css.createListingLink} name="NewListingPage">
                <span className={css.createListing}>
                  <FormattedMessage id="TopbarDesktop.createListing" />
                </span>
              </NamedLink>
            )}
            {inboxLink}
            {profileMenu}
            <div className={css.authLinks}>
              {signupBusinessLink}
              {signupLink}
              {loginLink}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={css.leftContent}>
            <LinkedLogo
              className={css.logoLink}
              logoSettings={{ format: 'image', height: 60 }}
              layout="desktop"
              alt={intl.formatMessage({ id: 'TopbarDesktop.logo' }, { marketplaceName })}
            />
            {search}
          </div>
          <div className={css.rightContent}>
            {userRole === 'author' && (
              <NamedLink className={css.createListingLink} name="NewListingPage">
                <span className={css.createListing}>
                  <FormattedMessage id="TopbarDesktop.createListing" />
                </span>
              </NamedLink>
            )}
            {inboxLink}
            {profileMenu}
            <div className={css.authLinks}>
              {signupBusinessLink}
              {signupLink}
              {loginLink}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

TopbarDesktop.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  currentPage: null,
  notificationCount: 0,
  initialSearchFormValues: {},
  appConfig: null,
};

TopbarDesktop.propTypes = {
  rootClassName: string,
  className: string,
  currentUserHasListings: bool.isRequired,
  currentUser: propTypes.currentUser,
  currentPage: string,
  isAuthenticated: bool.isRequired,
  onLogout: func.isRequired,
  notificationCount: number,
  onSearchSubmit: func.isRequired,
  initialSearchFormValues: object,
  intl: intlShape.isRequired,
  appConfig: object,
  // Add the React Router's location object to propTypes
  location: object.isRequired,
};

// Wrap TopbarDesktop with withRouter to get access to the location prop
export default withRouter(TopbarDesktop);
