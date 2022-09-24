import React, { Fragment, useState, useContext, useEffect } from 'react';
import Axios from 'axios';
import { Global, ViewContainer, AppContext } from '~/components/lib';

export function Template(props){

  let mounted;
  const context = useContext(AppContext);
  const [state, setState] = useState({ loading: false, refreshing: false });
  const [{{view}}, set{{view}}] = useState(null);

  useEffect(() => {

    mounted = true;
    fetch(false);
    return () => { mounted = false };

  }, []);

  async function fetch(refreshing){

    try {

      if (!mounted)
        return false;

      setState({ loading: true, refreshing: refreshing });

      const res = await Axios.get('/api/{{view}}');
      set{{view}}(res.data.data);

      setState({ loading: false, refreshing: false });

    }
    catch (err){

      context.handleError(err);

    }
  }

  return(
    <ViewContainer header scrollable
      loading={ state.loading }
      refreshing={ state.refreshing }
      onRefresh={ this.fetch }>

    </ViewContainer>
  );
}
