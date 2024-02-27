import React, { Component } from 'react';
import { bool, func, object, string, shape } from 'prop-types';
import { Form as FinalForm, Field } from 'react-final-form';
import classNames from 'classnames';
import { intlShape, injectIntl } from '../../../../util/reactIntl';
import { isMainSearchTypeKeywords } from '../../../../util/search';
import { Form, LocationAutocompleteInput } from '../../../../components';
import IconSearchDesktop from './IconSearchDesktop';
import css from './TopbarSearchForm.module.css';

const identity = v => v;

const KeywordSearchField = props => {
  const { keywordSearchWrapperClasses, iconClass, intl, isMobile, inputRef } = props;
  return (
    <div className={keywordSearchWrapperClasses}>
      <button className={css.searchSubmit}>
        <div className={iconClass}>
          <IconSearchDesktop />
        </div>
      </button>
      <Field
        name="keywords"
        render={({ input, meta }) => (
          <input
            className={isMobile ? css.mobileInput : css.desktopInput}
            {...input}
            id={isMobile ? 'keyword-search-mobile' : 'keyword-search'}
            data-testid={isMobile ? 'keyword-search-mobile' : 'keyword-search'}
            ref={inputRef}
            type="text"
            placeholder={intl.formatMessage({ id: 'TopbarSearchForm.placeholder' })}
            autoComplete="off"
          />
        )}
      />
    </div>
  );
};

const LocationSearchField = props => {
  const { desktopInputRootClass, intl, isMobile, inputRef, onLocationChange } = props;
  return (
    <Field
      name="location"
      format={identity}
      render={({ input, meta }) => {
        const { onChange, ...restInput } = input;
        const searchOnChange = value => {
          onChange(value);
          onLocationChange(value);
        };

        return (
          <LocationAutocompleteInput
            className={isMobile ? css.mobileInputRoot : desktopInputRootClass}
            iconClassName={isMobile ? css.mobileIcon : css.desktopIcon}
            inputClassName={isMobile ? css.mobileInput : css.desktopInput}
            predictionsClassName={isMobile ? css.mobilePredictions : css.desktopPredictions}
            predictionsAttributionClassName={isMobile ? css.mobilePredictionsAttribution : null}
            placeholder={intl.formatMessage({ id: 'TopbarSearchForm.placeholder' })}
            closeOnBlur={!isMobile}
            inputRef={inputRef}
            input={{ ...restInput, onChange: searchOnChange }}
            meta={meta}
          />
        );
      }}
    />
  );
};

class TopbarSearchFormComponent extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.searchInput = null;
    this.setSearchInputRef = element => {
      this.searchInput = element;
    };
  }

  componentDidMount() {
    this.applySearchParams();
  }

  componentDidUpdate(prevProps) {
    // Only apply searchParams if they have changed
    if (prevProps.searchParams !== this.props.searchParams) {
      this.applySearchParams();
    }
  }

  applySearchParams() {
    const { searchParams, appConfig } = this.props;
    if (isMainSearchTypeKeywords(appConfig) && searchParams.keyword && searchParams.keyword.trim() !== '') {
      this.onSubmit({ keywords: searchParams.keyword });
    } else if (searchParams.location && searchParams.location.trim() !== '') {
      this.onChange({ selectedPlace: searchParams.location });
    }
    // Additional handling for joy and time can be implemented here
  }

  onChange(location) {
    const { onSubmit } = this.props;
    onSubmit({ location });
    this.searchInput?.blur();
  }

  onSubmit(values) {
    const { onSubmit } = this.props;
    onSubmit(values);
    this.searchInput?.blur();
  }



    render() {
      const { intl, isMobile, className, rootClassName, desktopInputRoot, appConfig } = this.props;
      const isKeywordsSearch = isMainSearchTypeKeywords(appConfig);
      const classes = classNames(rootClassName, className);
      const desktopInputRootClass = desktopInputRoot || css.desktopInputRoot;
  
      return (
          <FinalForm
              onSubmit={this.onSubmit}
              render={({ handleSubmit }) => {
                  return (
                      <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="SearchPage">
                          {isKeywordsSearch ? (
                              <KeywordSearchField
                                  keywordSearchWrapperClasses={classNames(css.keywordSearchWrapper, isMobile ? css.mobileInputRoot : desktopInputRootClass)}
                                  iconClass={classNames(isMobile ? css.mobileIcon : css.desktopIcon || css.icon)}
                                  intl={intl}
                                  isMobile={isMobile}
                                  inputRef={this.setSearchInputRef}
                              />
                          ) : (
                              <LocationSearchField
                                  desktopInputRootClass={desktopInputRootClass}
                                  intl={intl}
                                  isMobile={isMobile}
                                  inputRef={this.setSearchInputRef}
                                  onLocationChange={this.onChange}
                              />
                          )}
                      </Form>
                  );
              }}
          />
      );
  }
}

TopbarSearchFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  desktopInputRoot: string,
  onSubmit: func.isRequired,
  isMobile: bool,
  appConfig: object.isRequired,
  intl: intlShape.isRequired,
  searchParams: shape({
    joy: string,
    location: string,
    time: string,
    keyword: string,
  }),
};

TopbarSearchFormComponent.defaultProps = {
  searchParams: {
    joy: '',
    location: '',
    time: '',
    keyword: '',
  },
};

const TopbarSearchForm = injectIntl(TopbarSearchFormComponent);

export default TopbarSearchForm;
