import React, { Fragment, useState } from 'react';
import { Loader, useAPI } from 'components/lib';

export function {{capitalisedName}}(props){

  const [state, setState] = useState({});
  const data = useAPI('/api/{{view}}');

  if (!data)
    return false;

  return(
    <Fragment>

      {/* render view data */ }

    </Fragment>

  );
}
