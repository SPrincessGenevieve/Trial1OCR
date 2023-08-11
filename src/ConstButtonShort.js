import React from 'react';
import { Button } from 'react-native';

function ConstButtonShort({title,onPress}) {
    return (
        <>
        <Button onPress={onPress} title={title}></Button>
        </>
    );
}

export default ConstButtonShort;